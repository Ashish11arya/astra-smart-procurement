import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { GovernmentConfigService } from '../government/government-config.service';
import {
  CentreVerificationStatus,
  CentreOperationalStatus,
  CounterStatus,
  BookingSession,
  BookingStatus,
  ProcurementCentreDto,
  StateDto,
  DistrictDto,
  CentreCapacityConfigDto,
  UpdateCentreCapacityDto,
  CentreCapacityAuditDto,
} from '@astra/shared';

@Injectable()
export class CentreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
    private readonly govConfig: GovernmentConfigService,
  ) {}

  /**
   * Geodesic Haversine formula to compute distance between two lat/lon coordinates in km.
   */
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * List all states
   */
  async getStates(): Promise<StateDto[]> {
    return this.prisma.state.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List districts for a state
   */
  async getDistricts(stateId?: string): Promise<DistrictDto[]> {
    return this.prisma.district.findMany({
      where: {
        isActive: true,
        ...(stateId ? { stateId } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Public discovery: Returns ONLY centres that are VERIFIED and ACTIVE.
   * Supports optional state, district, query, and lat/long for approximate distance.
   */
  async discoverCentres(params: {
    stateId?: string;
    districtId?: string;
    search?: string;
    lat?: number;
    lon?: number;
  }): Promise<ProcurementCentreDto[]> {
    const where: any = {
      verificationStatus: {
        in: [CentreVerificationStatus.VERIFIED, CentreVerificationStatus.ACTIVE],
      },
      operationalStatus: CentreOperationalStatus.OPEN,
    };

    if (params.stateId) where.stateId = params.stateId;
    if (params.districtId) where.districtId = params.districtId;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { centreCode: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const centres = await this.prisma.procurementCentre.findMany({
      where,
      include: {
        state: true,
        district: true,
        counters: true,
      },
      orderBy: { name: 'asc' },
    });

    return centres.map((c) => {
      let distanceKm: number | undefined;
      if (params.lat !== undefined && params.lon !== undefined && !isNaN(params.lat) && !isNaN(params.lon)) {
        distanceKm = this.calculateDistanceKm(params.lat, params.lon, c.latitude, c.longitude);
      }

      return {
        id: c.id,
        centreCode: c.centreCode,
        name: c.name,
        stateId: c.stateId,
        stateName: c.state.name,
        districtId: c.districtId,
        districtName: c.district.name,
        block: c.block,
        address: c.address,
        latitude: c.latitude,
        longitude: c.longitude,
        agency: c.agency,
        operatingDays: c.operatingDays,
        operatingHoursStart: c.operatingHoursStart,
        operatingHoursEnd: c.operatingHoursEnd,
        morningCapacityQuintals: c.morningCapacityQuintals,
        afternoonCapacityQuintals: c.afternoonCapacityQuintals,
        maxHourlyCapacityQuintals: c.maxHourlyCapacityQuintals,
        slotDurationMinutes: c.slotDurationMinutes,
        maxQuantityPerBooking: c.maxQuantityPerBooking,
        verificationStatus: c.verificationStatus as CentreVerificationStatus,
        operationalStatus: c.operationalStatus as CentreOperationalStatus,
        contactPhone: c.contactPhone,
        contactEmail: c.contactEmail,
        distanceKm,
        counters: c.counters.map((cnt) => ({
          id: cnt.id,
          centreId: cnt.centreId,
          counterNumber: cnt.counterNumber,
          counterName: cnt.counterName,
          status: cnt.status as CounterStatus,
        })),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Get public details of a verified centre with 7-day session availability calendar.
   */
  async getCentreDetails(id: string) {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id },
      include: {
        state: true,
        district: true,
        counters: true,
      },
    });

    if (!centre) {
      throw new NotFoundException(`Procurement centre not found: ${id}`);
    }

    const availability7Days = await this.schedulingService.getCentre7DayAvailability(id);

    return {
      centre: {
        id: centre.id,
        centreCode: centre.centreCode,
        name: centre.name,
        stateId: centre.stateId,
        stateName: centre.state.name,
        districtId: centre.districtId,
        districtName: centre.district.name,
        block: centre.block,
        address: centre.address,
        latitude: centre.latitude,
        longitude: centre.longitude,
        agency: centre.agency,
        operatingDays: centre.operatingDays,
        operatingHoursStart: centre.operatingHoursStart,
        operatingHoursEnd: centre.operatingHoursEnd,
        morningCapacityQuintals: centre.morningCapacityQuintals,
        afternoonCapacityQuintals: centre.afternoonCapacityQuintals,
        maxHourlyCapacityQuintals: centre.maxHourlyCapacityQuintals,
        slotDurationMinutes: centre.slotDurationMinutes,
        maxQuantityPerBooking: centre.maxQuantityPerBooking,
        verificationStatus: centre.verificationStatus,
        operationalStatus: centre.operationalStatus,
        contactPhone: centre.contactPhone,
        contactEmail: centre.contactEmail,
        counters: centre.counters,
      },
      availability7Days,
    };
  }

  /**
   * Operational dashboard for Procurement Centre Officer.
   * Strictly verifies officer's assigned centre.
   */
  async getCentreOfficerDashboard(userId: string, dateStr?: string) {
    // Find officer assignment
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        centre: {
          include: {
            state: true,
            district: true,
            counters: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You have not been assigned to an authorised procurement centre.');
    }

    const centre = assignment.centre;
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

    // Fetch scheduled arrivals for target date
    const todayBookings = await this.prisma.procurementBooking.findMany({
      where: {
        centreId: centre.id,
        bookingDate: {
          gte: startDate,
          lt: endDate,
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
        { session: 'asc' },
        { windowStartTime: 'asc' },
      ],
    });

    const morningBookings = todayBookings.filter((b) => b.session === BookingSession.MORNING);
    const afternoonBookings = todayBookings.filter((b) => b.session === BookingSession.AFTERNOON);

    const morningExpectedQuintals = morningBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);
    const afternoonExpectedQuintals = afternoonBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);

    const checkedInCount = todayBookings.filter((b) => b.status !== BookingStatus.BOOKED && b.status !== BookingStatus.CANCELLED).length;
    const completedCount = todayBookings.filter((b) => b.status === BookingStatus.COMPLETED).length;

    // Calculate real processing durations from actual timestamps
    const queueDurations: number[] = [];
    const weighmentDurations: number[] = [];
    const qualityDurations: number[] = [];
    const procurementDurations: number[] = [];
    const totalDurations: number[] = [];

    const detailedBookings = todayBookings.map((b) => {
      let queueMinutes: number | null = null;
      let weighmentMinutes: number | null = null;
      let qualityMinutes: number | null = null;
      let procurementMinutes: number | null = null;
      let totalMinutes: number | null = null;

      if (b.checkInTime && b.weighment?.createdAt) {
        queueMinutes = Math.max(1, Math.round((new Date(b.weighment.createdAt).getTime() - new Date(b.checkInTime).getTime()) / 60000));
        weighmentMinutes = 5; // standard vehicle weighment duration
        queueDurations.push(queueMinutes);
        weighmentDurations.push(weighmentMinutes);
      }

      if (b.weighment?.createdAt && b.quality?.assessedAt) {
        qualityMinutes = Math.max(1, Math.round((new Date(b.quality.assessedAt).getTime() - new Date(b.weighment.createdAt).getTime()) / 60000));
        qualityDurations.push(qualityMinutes);
      }

      if (b.quality?.assessedAt && b.procurement?.decidedAt) {
        procurementMinutes = Math.max(1, Math.round((new Date(b.procurement.decidedAt).getTime() - new Date(b.quality.assessedAt).getTime()) / 60000));
        procurementDurations.push(procurementMinutes);
      }

      const finalTime = b.payment?.settledAt || b.procurement?.decidedAt;
      if (b.checkInTime && finalTime) {
        totalMinutes = Math.max(1, Math.round((new Date(finalTime).getTime() - new Date(b.checkInTime).getTime()) / 60000));
        totalDurations.push(totalMinutes);
      }

      return {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        farmerName: b.farmer.fullName,
        farmerCode: b.farmer.farmerCode,
        farmerMobile: b.farmer.mobile ? b.farmer.mobile.slice(-4).padStart(10, 'X') : 'XXXXXXXXXX',
        expectedQuantityQuintals: b.expectedQuantityQuintals,
        actualWeightQuintals: b.weighment?.approvedFinalWeight || b.weighment?.originalHardwareWeight || null,
        qualityGrade: b.quality?.grade || null,
        status: b.status,
        session: b.session,
        windowStartTime: b.windowStartTime,
        windowEndTime: b.windowEndTime,
        vehicleNumber: b.vehicleNumber,
        bookingDate: b.bookingDate.toISOString(),
        createdAt: b.createdAt.toISOString(),
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        weighedAt: b.weighment?.createdAt ? b.weighment.createdAt.toISOString() : null,
        qualityAssessedAt: b.quality?.assessedAt ? b.quality.assessedAt.toISOString() : null,
        procuredAt: b.procurement?.decidedAt ? b.procurement.decidedAt.toISOString() : null,
        paymentSettledAt: b.payment?.settledAt ? b.payment.settledAt.toISOString() : null,
        durations: {
          queueMinutes,
          weighmentMinutes,
          qualityMinutes,
          procurementMinutes,
          totalMinutes,
        },
      };
    });

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return {
      centre: {
        id: centre.id,
        centreCode: centre.centreCode,
        name: centre.name,
        stateName: centre.state.name,
        districtName: centre.district.name,
        agency: centre.agency,
        operatingHours: `${centre.operatingHoursStart} – ${centre.operatingHoursEnd}`,
        morningCapacityQuintals: centre.morningCapacityQuintals,
        afternoonCapacityQuintals: centre.afternoonCapacityQuintals,
        operationalStatus: centre.operationalStatus,
      },
      counters: centre.counters,
      workload: {
        todayTotalBookings: todayBookings.length,
        checkedInCount,
        completedCount,
        morning: {
          totalBookings: morningBookings.length,
          expectedQuintals: morningExpectedQuintals,
          capacityQuintals: centre.morningCapacityQuintals,
          utilizationPercent: Math.round((morningExpectedQuintals / (centre.morningCapacityQuintals || 1)) * 100),
        },
        afternoon: {
          totalBookings: afternoonBookings.length,
          expectedQuintals: afternoonExpectedQuintals,
          capacityQuintals: centre.afternoonCapacityQuintals,
          utilizationPercent: Math.round((afternoonExpectedQuintals / (centre.afternoonCapacityQuintals || 1)) * 100),
        },
      },
      averageProcessingTimes: {
        queueWaitingMinutes: avg(queueDurations),
        weighmentMinutes: avg(weighmentDurations),
        qualityMinutes: avg(qualityDurations),
        procurementMinutes: avg(procurementDurations),
        totalProcessingMinutes: avg(totalDurations),
      },
      allBookings: detailedBookings,
      scheduleTimeline: {
        morning: morningBookings.map((b) => ({
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          farmerName: b.farmer.fullName,
          farmerMobile: b.farmer.mobile.slice(-4).padStart(10, 'X'),
          windowStartTime: b.windowStartTime,
          windowEndTime: b.windowEndTime,
          expectedQuantityQuintals: b.expectedQuantityQuintals,
          status: b.status,
          vehicleNumber: b.vehicleNumber,
        })),
        afternoon: afternoonBookings.map((b) => ({
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          farmerName: b.farmer.fullName,
          farmerMobile: b.farmer.mobile.slice(-4).padStart(10, 'X'),
          windowStartTime: b.windowStartTime,
          windowEndTime: b.windowEndTime,
          expectedQuantityQuintals: b.expectedQuantityQuintals,
          status: b.status,
          vehicleNumber: b.vehicleNumber,
        })),
      },
    };
  }

  /**
   * Procurement Centre Officer can update counter availability status
   */
  /**
   * Get 7-day rolling forecast for centre operational planning
   */
  async getCentreForecast(userId: string) {
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: { userId, isActive: true },
      include: { centre: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Not assigned to any active procurement centre.');
    }
    const centre = assignment.centre;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const forecast: Array<{
      date: string;
      morningBookings: number;
      morningQuintals: number;
      afternoonBookings: number;
      afternoonQuintals: number;
      totalBookings: number;
      totalExpectedQuintals: number;
      totalCapacityQuintals: number;
      utilizationPercent: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const bookings = await this.prisma.procurementBooking.findMany({
        where: {
          centreId: centre.id,
          bookingDate: { gte: d, lt: nextD },
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      });

      const m = bookings.filter((b) => b.session === BookingSession.MORNING);
      const a = bookings.filter((b) => b.session === BookingSession.AFTERNOON);
      const mQtl = m.reduce((acc, b) => acc + b.expectedQuantityQuintals, 0);
      const aQtl = a.reduce((acc, b) => acc + b.expectedQuantityQuintals, 0);
      const totalCap = centre.morningCapacityQuintals + centre.afternoonCapacityQuintals;
      const totalQtl = mQtl + aQtl;
      const util = totalCap > 0 ? Math.min(100, Math.round((totalQtl / totalCap) * 100)) : 0;

      forecast.push({
        date: d.toISOString().split('T')[0],
        morningBookings: m.length,
        morningQuintals: mQtl,
        afternoonBookings: a.length,
        afternoonQuintals: aQtl,
        totalBookings: bookings.length,
        totalExpectedQuintals: totalQtl,
        totalCapacityQuintals: totalCap,
        utilizationPercent: util,
      });
    }

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        centreCode: centre.centreCode,
        morningCapacityQuintals: centre.morningCapacityQuintals,
        afternoonCapacityQuintals: centre.afternoonCapacityQuintals,
      },
      forecast,
    };
  }

  async updateCounterStatus(userId: string, counterId: string, status: CounterStatus) {
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: { userId, isActive: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Not authorised for any centre.');
    }

    const counter = await this.prisma.centreCounter.findUnique({
      where: { id: counterId },
    });
    if (!counter || counter.centreId !== assignment.centreId) {
      throw new ForbiddenException('Counter does not belong to your assigned centre.');
    }

    return this.prisma.centreCounter.update({
      where: { id: counterId },
      data: { status },
    });
  }

  /**
   * Public aggregate procurement summary for Astra homepage and transparency display.
   * Exposes zero PII / personal farmer data.
   */
  async getPublicProcurementSummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      farmersRegistered,
      processedFarmersGroup,
      quantityProcuredAgg,
      procurementCentres,
      farmersTodayGroup,
      quantityTodayAgg,
      activeCentresToday,
    ] = await Promise.all([
      // Total unique registered farmers
      this.prisma.farmer.count(),

      // Farmers whose procurement has completed operational flow
      this.prisma.procurementBooking.groupBy({
        by: ['farmerId'],
        where: {
          status: BookingStatus.COMPLETED,
        },
      }),

      // Actual confirmed procurement volume (in Quintals)
      this.prisma.procurementDecisionRecord.aggregate({
        _sum: {
          acceptedQuantityQuintals: true,
          totalAmount: true,
        },
      }),

      // Active & verified procurement centres
      this.prisma.procurementCentre.count({
        where: {
          verificationStatus: {
            in: [CentreVerificationStatus.ACTIVE, CentreVerificationStatus.VERIFIED],
          },
        },
      }),

      // Today's completed farmers
      this.prisma.procurementBooking.groupBy({
        by: ['farmerId'],
        where: {
          status: BookingStatus.COMPLETED,
          updatedAt: { gte: startOfDay },
        },
      }),

      // Today's procured quantity
      this.prisma.procurementDecisionRecord.aggregate({
        _sum: {
          acceptedQuantityQuintals: true,
        },
        where: {
          decidedAt: { gte: startOfDay },
        },
      }),

      // Open centres today
      this.prisma.procurementCentre.count({
        where: {
          verificationStatus: {
            in: [CentreVerificationStatus.ACTIVE, CentreVerificationStatus.VERIFIED],
          },
          operationalStatus: CentreOperationalStatus.OPEN,
        },
      }),
    ]);

    return {
      farmersRegistered,
      farmersProcessed: processedFarmersGroup.length,
      quantityProcured: Number((quantityProcuredAgg._sum.acceptedQuantityQuintals || 0).toFixed(2)),
      totalDisbursedAmount: Number((quantityProcuredAgg._sum.totalAmount || 0).toFixed(2)),
      procurementCentres,
      today: {
        farmersProcessedToday: farmersTodayGroup.length,
        quantityProcuredToday: Number((quantityTodayAgg._sum.acceptedQuantityQuintals || 0).toFixed(2)),
        activeCentresToday,
      },
      reportingPeriod: 'Kharif & Rabi Season 2026–27',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Retrieves Centre Capacity Configuration for Centre Head workspace.
   * Returns Government policy ceiling (read-only) and operational limits.
   */
  async getCentreCapacityConfig(userId: string): Promise<CentreCapacityConfigDto> {
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: { userId, isActive: true },
      include: { centre: true },
    });

    let centre = assignment?.centre;
    if (!centre) {
      centre = await this.prisma.procurementCentre.findFirst({
        where: {
          verificationStatus: { in: [CentreVerificationStatus.ACTIVE, CentreVerificationStatus.VERIFIED] },
        },
      });
    }

    if (!centre) {
      throw new NotFoundException('No active procurement centre found.');
    }

    const policy = this.govConfig.getPolicy();
    const audits = await this.prisma.centreCapacityAudit.findMany({
      where: { centreId: centre.id },
      orderBy: { changedAt: 'desc' },
      take: 10,
    });

    const recentAudits: CentreCapacityAuditDto[] = audits.map((a) => ({
      id: a.id,
      centreId: a.centreId,
      changedBy: a.changedBy,
      changedAt: a.changedAt.toISOString(),
      fieldChanged: a.fieldChanged,
      oldValue: a.oldValue,
      newValue: a.newValue,
      crop: a.crop,
      season: a.season,
      effectiveDate: a.effectiveDate.toISOString(),
      reason: a.reason || undefined,
    }));

    return {
      centreId: centre.id,
      centreName: centre.name,
      centreCode: centre.centreCode,
      crop: policy.crop,
      season: policy.season,
      effectiveDate: new Date().toISOString().split('T')[0],
      governmentMaximumPerFarmerQuintals: policy.governmentMaximumPerFarmerQuintals,
      centreDailyFarmerLimitQuintals: centre.centreDailyFarmerLimit || policy.defaultCentreDailyFarmerLimit,
      minimumBookingQuantityQuintals: centre.minBookingQuantityQuintals || policy.minimumBookingQuantityQuintals,
      totalDailyCapacityQuintals: centre.morningCapacityQuintals + centre.afternoonCapacityQuintals,
      morningCapacityQuintals: centre.morningCapacityQuintals,
      afternoonCapacityQuintals: centre.afternoonCapacityQuintals,
      slotDurationMinutes: centre.slotDurationMinutes,
      operatingDays: centre.operatingDays,
      recentAudits,
    };
  }

  /**
   * Updates Centre Capacity Configuration.
   * STRICT SECURITY ENFORCEMENT: Centre daily limit CANNOT exceed government ceiling.
   */
  async updateCentreCapacityConfig(userId: string, dto: UpdateCentreCapacityDto): Promise<CentreCapacityConfigDto> {
    const assignment = await this.prisma.centrePersonnelAssignment.findFirst({
      where: { userId, isActive: true },
      include: { centre: true },
    });

    let centre = assignment?.centre;
    if (!centre) {
      centre = await this.prisma.procurementCentre.findFirst({
        where: {
          verificationStatus: { in: [CentreVerificationStatus.ACTIVE, CentreVerificationStatus.VERIFIED] },
        },
      });
    }

    if (!centre) {
      throw new NotFoundException('No active procurement centre found.');
    }

    const policy = this.govConfig.getPolicy();

    // STRICT BUSINESS RULE: Centre Head cannot exceed Government Ceiling
    if (dto.centreDailyFarmerLimitQuintals > policy.governmentMaximumPerFarmerQuintals) {
      throw new BadRequestException(
        `The centre daily limit (${dto.centreDailyFarmerLimitQuintals} q) cannot exceed the applicable government procurement limit of ${policy.governmentMaximumPerFarmerQuintals} q.`,
      );
    }

    const minQty = dto.minimumBookingQuantityQuintals !== undefined ? dto.minimumBookingQuantityQuintals : centre.minBookingQuantityQuintals;
    if (dto.centreDailyFarmerLimitQuintals < minQty) {
      throw new BadRequestException(
        `Centre daily farmer limit (${dto.centreDailyFarmerLimitQuintals} q) cannot be less than the minimum booking quantity (${minQty} q).`,
      );
    }

    const oldLimit = centre.centreDailyFarmerLimit;
    const newLimit = dto.centreDailyFarmerLimitQuintals;

    // Update centre
    await this.prisma.procurementCentre.update({
      where: { id: centre.id },
      data: {
        centreDailyFarmerLimit: newLimit,
        minBookingQuantityQuintals: dto.minimumBookingQuantityQuintals !== undefined ? dto.minimumBookingQuantityQuintals : undefined,
        morningCapacityQuintals: dto.morningCapacityQuintals !== undefined ? dto.morningCapacityQuintals : undefined,
        afternoonCapacityQuintals: dto.afternoonCapacityQuintals !== undefined ? dto.afternoonCapacityQuintals : undefined,
      },
    });

    // Record audit trail
    if (oldLimit !== newLimit) {
      await this.prisma.centreCapacityAudit.create({
        data: {
          centreId: centre.id,
          changedBy: userId,
          fieldChanged: 'centreDailyFarmerLimitQuintals',
          oldValue: oldLimit,
          newValue: newLimit,
          crop: policy.crop,
          season: policy.season,
          effectiveDate: new Date(),
          reason: dto.reason || 'Operational capacity adjusted by Centre Head',
        },
      });
    }

    return this.getCentreCapacityConfig(userId);
  }
}
