import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../realtime/events.gateway';
import {
  WeighmentStatus,
  BookingStatus,
  HardwareSimulateReadingDto,
  WeighmentCorrectionRequestDto,
  WeighmentSupervisorDecisionDto,
} from '@astra/shared';

@Injectable()
export class WeighmentService {
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
   * Get weighment queue for officer's assigned centre.
   */
  async getWeighmentQueue(userId: string, dateStr?: string) {
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
            BookingStatus.CHECKED_IN,
            BookingStatus.WEIGHMENT,
            BookingStatus.QUALITY_ASSESSMENT,
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
      orderBy: [
        { checkInTime: 'asc' },
        { windowStartTime: 'asc' },
      ],
    });

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        centreCode: centre.centreCode,
      },
      connectedDevices: [
        {
          deviceCode: 'Scale-01',
          name: 'Electronic Weighbridge #1 (Mettler-Toledo)',
          status: 'CONNECTED_ONLINE',
          lastHeartbeat: new Date().toISOString(),
        },
        {
          deviceCode: 'Scale-02',
          name: 'Digital Platform Scale #2 (Avery Weigh-Tronix)',
          status: 'CONNECTED_ONLINE',
          lastHeartbeat: new Date().toISOString(),
        },
      ],
      queue: bookings.map((b) => ({
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        farmerName: b.farmer.fullName,
        farmerCode: b.farmer.farmerCode,
        farmerMobile: b.farmer.mobile ? b.farmer.mobile.slice(-4).padStart(10, 'X') : 'XXXXXXXXXX',
        commodityName: 'Wheat (गेहूं)',
        expectedQuantityQuintals: b.expectedQuantityQuintals,
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        createdAt: b.createdAt.toISOString(),
        status: b.status,
        weighment: b.weighment
          ? {
              id: b.weighment.id,
              deviceCode: b.weighment.deviceCode,
              originalHardwareWeight: b.weighment.originalHardwareWeight,
              approvedFinalWeight: b.weighment.approvedFinalWeight,
              status: b.weighment.status,
              correctionReason: b.weighment.correctionReason,
              officerRemarks: b.weighment.officerRemarks,
              requestedBy: b.weighment.requestedBy,
              requestedAt: b.weighment.requestedAt,
              approvedBy: b.weighment.approvedBy,
              approvedAt: b.weighment.approvedAt,
              createdAt: b.weighment.createdAt ? b.weighment.createdAt.toISOString() : null,
            }
          : null,
        quality: b.quality
          ? {
              grade: b.quality.grade,
              moisturePercent: b.quality.moisturePercent,
              assessedAt: b.quality.assessedAt.toISOString(),
            }
          : null,
        procurement: b.procurement
          ? {
              decision: b.procurement.decision,
              acceptedQuantityQuintals: b.procurement.acceptedQuantityQuintals,
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
   * Hardware API Adapter Simulator.
   * Connects to weighing hardware scale and returns reading for verification.
   */
  async simulateHardwareReading(dto: HardwareSimulateReadingDto) {
    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking record not found.');
    }

    return {
      bookingId: dto.bookingId,
      bookingNumber: booking.bookingNumber,
      deviceCode: dto.deviceCode || 'Scale-01',
      hardwareWeightQuintals: dto.hardwareWeightQuintals,
      timestamp: new Date().toISOString(),
      status: 'READING_RECEIVED',
    };
  }

  /**
   * Confirm and record verified hardware reading.
   * Normal weight comes from hardware reading; Weighment Officer cannot manually edit it.
   */
  async confirmHardwareWeighment(
    userId: string,
    bookingId: string,
    deviceCode: string,
    hardwareWeightQuintals: number,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: { weighment: true, farmer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking record not found.');
    }

    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('Booking does not belong to your assigned centre.');
    }

    if (booking.status !== BookingStatus.CHECKED_IN && booking.status !== BookingStatus.WEIGHMENT) {
      throw new BadRequestException(`Cannot weigh booking with status: ${booking.status}.`);
    }

    if (booking.weighment && booking.weighment.status === WeighmentStatus.RECORDED) {
      throw new BadRequestException('Hardware weighment has already been recorded for this visit.');
    }

    // Upsert weighment record preserving originalHardwareWeight
    const weighment = await this.prisma.weighmentRecord.upsert({
      where: { bookingId },
      create: {
        bookingId,
        deviceCode: deviceCode || 'Scale-01',
        originalHardwareWeight: hardwareWeightQuintals,
        status: WeighmentStatus.RECORDED,
      },
      update: {
        deviceCode: deviceCode || 'Scale-01',
        originalHardwareWeight: hardwareWeightQuintals,
        status: WeighmentStatus.RECORDED,
      },
    });

    // Advance booking to QUALITY_ASSESSMENT
    await this.prisma.procurementBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.QUALITY_ASSESSMENT,
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: 'WEIGHMENT_COMPLETED',
        bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'WEIGHMENT_OFFICER',
        newState: {
          deviceCode,
          originalHardwareWeight: hardwareWeightQuintals,
          status: WeighmentStatus.RECORDED,
        },
        reason: 'Hardware weight confirmed and recorded via device interface',
      },
    });

    // Notify Quality Department queue
    this.eventsGateway.emitToDepartment(centre.id, 'quality', 'queue:updated', {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      farmerName: booking.farmer.fullName,
      actualWeightQuintals: hardwareWeightQuintals,
    });

    return {
      message: 'Hardware weighment successfully captured and recorded.',
      weighment,
    };
  }

  /**
   * Exceptional Weighment Correction (Maker).
   * Weighment officer cannot directly edit weight.
   * Original hardware reading remains preserved!
   */
  async raiseCorrectionRequest(
    userId: string,
    bookingId: string,
    dto: WeighmentCorrectionRequestDto,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: { weighment: true },
    });

    if (!booking || !booking.weighment) {
      throw new BadRequestException('No recorded weighment found to raise a correction against.');
    }

    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('Booking does not belong to your assigned centre.');
    }

    if (dto.requestedFinalWeightQuintals <= 0) {
      throw new BadRequestException('Requested final weight must be greater than 0 quintals.');
    }

    if (!dto.reason || !dto.officerRemarks) {
      throw new BadRequestException('Reason and officer remark are mandatory for exceptional correction.');
    }

    const updatedWeighment = await this.prisma.weighmentRecord.update({
      where: { bookingId },
      data: {
        status: WeighmentStatus.CORRECTION_PENDING,
        correctionReason: dto.reason,
        officerRemarks: dto.officerRemarks,
        requestedBy: userId,
        requestedAt: new Date(),
        // Note: originalHardwareWeight is preserved and untouched!
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: 'WEIGHMENT_CORRECTION_REQUESTED',
        bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'WEIGHMENT_OFFICER',
        previousState: { originalHardwareWeight: booking.weighment.originalHardwareWeight },
        newState: {
          requestedFinalWeight: dto.requestedFinalWeightQuintals,
          reason: dto.reason,
          officerRemarks: dto.officerRemarks,
          status: WeighmentStatus.CORRECTION_PENDING,
        },
        reason: dto.reason,
      },
    });

    return {
      message: 'Correction request submitted for Authorised Weighment Supervisor approval.',
      weighment: updatedWeighment,
    };
  }

  /**
   * Pending correction requests for Authorised Weighment Supervisor
   */
  async getPendingCorrections(userId: string) {
    const centre = await this.getOfficerCentre(userId);

    const pending = await this.prisma.weighmentRecord.findMany({
      where: {
        booking: { centreId: centre.id },
        status: WeighmentStatus.CORRECTION_PENDING,
      },
      include: {
        booking: {
          include: { farmer: true },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });

    return pending.map((p) => ({
      recordId: p.id,
      bookingId: p.bookingId,
      bookingNumber: p.booking.bookingNumber,
      farmerName: p.booking.farmer.fullName,
      expectedQuantityQuintals: p.booking.expectedQuantityQuintals,
      originalHardwareReading: p.originalHardwareWeight,
      correctionReason: p.correctionReason,
      officerRemarks: p.officerRemarks,
      requestedBy: p.requestedBy,
      requestedAt: p.requestedAt,
      status: p.status,
    }));
  }

  /**
   * Authorised Weighment Supervisor Decision (Checker).
   * Maker-Checker rule: Officer who requested the correction CANNOT approve their own request!
   */
  async supervisorDecision(
    userId: string,
    recordId: string,
    dto: WeighmentSupervisorDecisionDto,
    requestedFinalWeightQuintals?: number,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const record = await this.prisma.weighmentRecord.findUnique({
      where: { id: recordId },
      include: { booking: true },
    });

    if (!record) {
      throw new NotFoundException('Weighment record not found.');
    }

    if (record.booking.centreId !== centre.id) {
      throw new ForbiddenException('Record does not belong to your assigned centre.');
    }

    if (record.status !== WeighmentStatus.CORRECTION_PENDING) {
      throw new BadRequestException(`Record is not pending correction (Current status: ${record.status}).`);
    }

    // Maker-Checker constraint
    if (record.requestedBy === userId) {
      throw new ForbiddenException(
        'Maker-Checker Violation: The officer who raised the correction request cannot approve their own correction.',
      );
    }

    const isApproved = dto.decision === 'APPROVE';
    const finalWeight = isApproved
      ? (requestedFinalWeightQuintals || record.originalHardwareWeight)
      : null;

    const updated = await this.prisma.weighmentRecord.update({
      where: { id: recordId },
      data: {
        status: isApproved ? WeighmentStatus.CORRECTION_APPROVED : WeighmentStatus.CORRECTION_REJECTED,
        approvedFinalWeight: finalWeight,
        approvedBy: userId,
        approvedAt: new Date(),
        officerRemarks: `${record.officerRemarks || ''} | Supervisor: ${dto.supervisorRemarks}`,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        eventType: isApproved ? 'WEIGHMENT_CORRECTION_APPROVED' : 'WEIGHMENT_CORRECTION_REJECTED',
        bookingId: record.bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'WEIGHMENT_SUPERVISOR',
        previousState: { originalHardwareWeight: record.originalHardwareWeight },
        newState: {
          approvedFinalWeight: finalWeight,
          status: updated.status,
          decision: dto.decision,
          supervisorRemarks: dto.supervisorRemarks,
        },
        reason: dto.supervisorRemarks,
      },
    });

    return {
      message: `Correction request ${dto.decision.toLowerCase()}d successfully.`,
      weighment: updated,
    };
  }
}
