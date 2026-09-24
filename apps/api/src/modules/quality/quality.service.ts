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
  QualityGrade,
  CreateQualityAssessmentDto,
} from '@astra/shared';

@Injectable()
export class QualityService {
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
   * Get queue of bookings waiting for or having quality assessments
   */
  async getQualityQueue(userId: string, dateStr?: string) {
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
        deviceCode: b.weighment?.deviceCode,
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        weighedAt: b.weighment?.createdAt ? b.weighment.createdAt.toISOString() : null,
        status: b.status,
        quality: b.quality
          ? {
              id: b.quality.id,
              moisturePercent: b.quality.moisturePercent,
              foreignMatterPercent: b.quality.foreignMatterPercent,
              damagedGrainPercent: b.quality.damagedGrainPercent,
              grade: b.quality.grade,
              remarks: b.quality.remarks,
              assessedBy: b.quality.assessedBy,
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
      })),
    };
  }

  /**
   * Record quality parameters and grade.
   */
  async recordQualityAssessment(
    userId: string,
    bookingId: string,
    dto: CreateQualityAssessmentDto,
  ) {
    const centre = await this.getOfficerCentre(userId);

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: { quality: true, farmer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking record not found.');
    }

    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('Booking does not belong to your assigned centre.');
    }

    if (booking.status !== BookingStatus.QUALITY_ASSESSMENT) {
      throw new BadRequestException(`Cannot assess quality for booking with status: ${booking.status}.`);
    }

    const anyDto = dto as any;
    const moisture = dto.moisturePercent !== undefined && !isNaN(Number(dto.moisturePercent))
      ? Number(dto.moisturePercent)
      : (anyDto.moistureContentPercent !== undefined && !isNaN(Number(anyDto.moistureContentPercent))
        ? Number(anyDto.moistureContentPercent)
        : 13.5);

    const grade = dto.grade || anyDto.qualityGrade || QualityGrade.GRADE_A;
    const foreign = dto.foreignMatterPercent !== undefined && !isNaN(Number(dto.foreignMatterPercent))
      ? Number(dto.foreignMatterPercent)
      : (anyDto.foreignMatter !== undefined && !isNaN(Number(anyDto.foreignMatter)) ? Number(anyDto.foreignMatter) : 1.2);

    const damaged = dto.damagedGrainPercent !== undefined && !isNaN(Number(dto.damagedGrainPercent))
      ? Number(dto.damagedGrainPercent)
      : (anyDto.damagedGrain !== undefined && !isNaN(Number(anyDto.damagedGrain)) ? Number(anyDto.damagedGrain) : 1.8);

    if (moisture < 0 || moisture > 40) {
      throw new BadRequestException('Moisture percentage must be between 0% and 40%.');
    }

    const isRejected = grade === QualityGrade.REJECTED;

    const quality = await this.prisma.qualityAssessmentRecord.upsert({
      where: { bookingId },
      create: {
        bookingId,
        moisturePercent: moisture,
        foreignMatterPercent: foreign,
        damagedGrainPercent: damaged,
        grade: grade,
        remarks: dto.remarks || null,
        assessedBy: userId,
      },
      update: {
        moisturePercent: moisture,
        foreignMatterPercent: foreign,
        damagedGrainPercent: damaged,
        grade: grade,
        remarks: dto.remarks || null,
        assessedBy: userId,
      },
    });

    // Advance status to PROCUREMENT or REJECTED
    const nextStatus = isRejected ? BookingStatus.CANCELLED : BookingStatus.PROCUREMENT;
    await this.prisma.procurementBooking.update({
      where: { id: bookingId },
      data: { status: nextStatus },
    });

    // Audit trail
    await this.prisma.auditLog.create({
      data: {
        eventType: 'QUALITY_ASSESSMENT_COMPLETED',
        bookingId,
        centreId: centre.id,
        actorId: userId,
        actorRole: 'QUALITY_OFFICER',
        newState: {
          grade: dto.grade,
          moisture: dto.moisturePercent,
          foreignMatter: dto.foreignMatterPercent,
          damagedGrain: dto.damagedGrainPercent,
        },
        reason: dto.remarks || 'Standard quality appraisal completed',
      },
    });

    if (!isRejected) {
      this.eventsGateway.emitToDepartment(centre.id, 'procurement', 'queue:updated', {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        farmerName: booking.farmer.fullName,
        grade: dto.grade,
      });
    }

    return {
      message: `Quality assessment completed. Grade: ${dto.grade}. Transferred to Procurement.`,
      quality,
    };
  }
}
