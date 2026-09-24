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
  ProcurementDecision,
  CreateProcurementDecisionDto,
} from '@astra/shared';

@Injectable()
export class ProcurementService {
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
   * Get queue of graded bookings ready for procurement decision
   */
  async getProcurementQueue(userId: string, dateStr?: string) {
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
          in: [
            BookingStatus.PROCUREMENT,
            BookingStatus.PAYMENT,
            BookingStatus.COMPLETED,
          ],
        },
      },
      include: {
        farmer: true,
        weighment: true,
        quality: true,
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
        expectedQuantityQuintals: b.expectedQuantityQuintals,
        actualWeightQuintals: b.weighment?.approvedFinalWeight || b.weighment?.originalHardwareWeight,
        qualityGrade: b.quality?.grade,
        moisturePercent: b.quality?.moisturePercent,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        weighment: b.weighment
          ? {
              actualWeightQuintals: b.weighment.approvedFinalWeight || b.weighment.originalHardwareWeight,
              deviceCode: b.weighment.deviceCode,
              weighedAt: b.weighment.createdAt ? b.weighment.createdAt.toISOString() : null,
            }
          : null,
        quality: b.quality
          ? {
              id: b.quality.id,
              grade: b.quality.grade,
              moisturePercent: b.quality.moisturePercent,
              foreignMatterPercent: b.quality.foreignMatterPercent,
              damagedGrainPercent: b.quality.damagedGrainPercent,
              remarks: b.quality.remarks,
              assessedAt: b.quality.assessedAt.toISOString(),
            }
          : null,
        procurement: b.procurement
          ? {
              id: b.procurement.id,
              decision: b.procurement.decision,
              acceptedQuantityQuintals: b.procurement.acceptedQuantityQuintals,
              ratePerQuintal: b.procurement.ratePerQuintal,
              totalAmount: b.procurement.totalAmount,
              remarks: b.procurement.remarks,
              decidedBy: b.procurement.decidedBy,
              decidedAt: b.procurement.decidedAt.toISOString(),
            }
          : null,
        payment: b.payment
          ? {
              paymentStatus: b.payment.paymentStatus,
              amount: b.payment.amount,
              settledAt: b.payment.settledAt ? b.payment.settledAt.toISOString() : null,
            }
          : null,
      })),
    };
  }

  /**
   * Record procurement acceptance decision and compute payment amount.
   */
  async recordProcurementDecision(
    userId: string,
    bookingId: string,
    dto: CreateProcurementDecisionDto,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: { weighment: true, quality: true, farmer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking record not found.');
    }

    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('Booking does not belong to your assigned centre.');
    }

    if (booking.status !== BookingStatus.PROCUREMENT) {
      throw new BadRequestException(`Cannot make procurement decision for booking with status: ${booking.status}.`);
    }

    if (!booking.quality) {
      throw new BadRequestException('Quality assessment is required before procurement purchase confirmation.');
    }

    if (dto.acceptedQuantityQuintals <= 0 && dto.decision === ProcurementDecision.ACCEPTED) {
      throw new BadRequestException('Accepted quantity must be greater than 0 quintals.');
    }

    const totalAmount = Math.round(dto.acceptedQuantityQuintals * dto.ratePerQuintal * 100) / 100;

    const record = await this.prisma.procurementDecisionRecord.upsert({
      where: { bookingId },
      create: {
        bookingId,
        decision: dto.decision,
        acceptedQuantityQuintals: dto.acceptedQuantityQuintals,
        ratePerQuintal: dto.ratePerQuintal,
        totalAmount,
        remarks: dto.remarks || null,
        decidedBy: userId,
      },
      update: {
        decision: dto.decision,
        acceptedQuantityQuintals: dto.acceptedQuantityQuintals,
        ratePerQuintal: dto.ratePerQuintal,
        totalAmount,
        remarks: dto.remarks || null,
        decidedBy: userId,
      },
    });

    // Advance status to PAYMENT
    await this.prisma.procurementBooking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAYMENT },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: 'PROCUREMENT_COMPLETED',
        bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'PROCUREMENT_OFFICER',
        newState: {
          decision: dto.decision,
          acceptedQuantity: dto.acceptedQuantityQuintals,
          rate: dto.ratePerQuintal,
          totalAmount,
        },
        reason: dto.remarks || 'Purchase quota and transaction verified by Procurement Officer',
      },
    });

    // Notify Payment Department
    this.eventsGateway.emitToDepartment(centre.id, 'payment', 'queue:updated', {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      farmerName: booking.farmer.fullName,
      totalAmount,
    });

    return {
      message: `Procurement recorded successfully. Total payable: ₹${totalAmount.toLocaleString('en-IN')}. Sent to Settlement.`,
      procurement: record,
    };
  }
}
