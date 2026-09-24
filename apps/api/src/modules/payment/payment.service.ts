import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../realtime/events.gateway';
import {
  BookingStatus,
  PaymentStatus,
  CreatePaymentSettlementDto,
} from '@astra/shared';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async getOfficerCentre(userId: string) {
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: { userId, isActive: true },
      include: { centre: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Not assigned to any active procurement centre.');
    }
    return assignment.centre;
  }

  /**
   * Get queue of bookings pending or completed payment settlement
   */
  async getPaymentQueue(userId: string, dateStr?: string) {
    const centre = await this.getOfficerCentre(userId);

    let startDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed;
      }
    }
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const bookings = await this.prisma.procurementBooking.findMany({
      where: {
        centreId: centre.id,
        bookingDate: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          in: [BookingStatus.PAYMENT, BookingStatus.COMPLETED],
        },
      },
      include: {
        farmer: true,
        weighment: true,
        procurement: true,
        payment: true,
      },
      orderBy: { checkInTime: 'asc' },
    });

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        centreCode: centre.centreCode,
      },
      queue: bookings.map((b) => ({
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        farmerName: b.farmer.fullName,
        farmerCode: b.farmer.farmerCode,
        farmerMobile: b.farmer.mobile ? b.farmer.mobile.slice(-4).padStart(10, 'X') : 'XXXXXXXXXX',
        commodityName: 'Wheat (गेहूं)',
        payableAmount: b.procurement?.totalAmount || 0,
        acceptedQuantityQuintals: b.procurement?.acceptedQuantityQuintals,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        weighedAt: b.weighment?.createdAt ? b.weighment.createdAt.toISOString() : null,
        procuredAt: b.procurement?.decidedAt ? b.procurement.decidedAt.toISOString() : null,
        payment: b.payment
          ? {
              id: b.payment.id,
              paymentStatus: b.payment.paymentStatus,
              transactionRef: b.payment.transactionRef,
              bankAccountMasked: b.payment.bankAccountMasked,
              amount: b.payment.amount,
              settledBy: b.payment.settledBy,
              settledAt: b.payment.settledAt ? b.payment.settledAt.toISOString() : null,
            }
          : null,
      })),
    };
  }

  /**
   * Record payment settlement details and mark visit completed
   */
  async recordPaymentSettlement(
    userId: string,
    bookingId: string,
    dto: CreatePaymentSettlementDto,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: { procurement: true, farmer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking record not found.');
    }

    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('Booking does not belong to your assigned centre.');
    }

    if (booking.status !== BookingStatus.PAYMENT && booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(`Cannot settle payment for booking with status: ${booking.status}.`);
    }

    const settledAt = new Date();

    const record = await this.prisma.paymentSettlementRecord.upsert({
      where: { bookingId },
      create: {
        bookingId,
        paymentStatus: dto.paymentStatus || PaymentStatus.SETTLED,
        transactionRef: dto.transactionRef || `DBT-ASTRA-${Date.now().toString().slice(-8)}`,
        bankAccountMasked: dto.bankAccountMasked || 'XXXX-XXXX-4819',
        amount: dto.amount,
        settledBy: userId,
        settledAt,
      },
      update: {
        paymentStatus: dto.paymentStatus || PaymentStatus.SETTLED,
        transactionRef: dto.transactionRef || `DBT-ASTRA-${Date.now().toString().slice(-8)}`,
        bankAccountMasked: dto.bankAccountMasked || 'XXXX-XXXX-4819',
        amount: dto.amount,
        settledBy: userId,
        settledAt,
      },
    });

    // Mark visit COMPLETED
    await this.prisma.procurementBooking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: 'PAYMENT_UPDATED',
        bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'PAYMENT_OFFICER',
        newState: {
          paymentStatus: dto.paymentStatus,
          amount: dto.amount,
          transactionRef: record.transactionRef,
        },
        reason: 'DBT Payment settlement order dispatched and confirmed',
      },
    });

    // Real-time update to farmer
    this.eventsGateway.emitToFarmer(booking.farmerId, 'payment:settled', {
      bookingNumber: booking.bookingNumber,
      amount: dto.amount,
      transactionRef: record.transactionRef,
      status: PaymentStatus.SETTLED,
    });

    return {
      message: 'Payment settlement recorded and procurement visit completed.',
      payment: record,
    };
  }
}
