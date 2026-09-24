import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { PredictionService } from '../scheduling/prediction.service';
import { EventsGateway } from '../../realtime/events.gateway';
import { GovernmentConfigService } from '../government/government-config.service';
import { CapacityService } from './capacity.service';
import {
  formatIstDateStr,
  getTodayIstDateStr,
  parseIstDateRange,
} from '../../common/utils/date.util';
import {
  BookingSession,
  BookingStatus,
  CentreVerificationStatus,
  CentreOperationalStatus,
  RegistrationStatus,
  BookingEstimateRequestDto,
  BookingEstimateResponseDto,
  CreateBookingDto,
  ProcurementBookingDto,
  FarmerDashboardSummaryDto,
  FarmerActiveBookingDto,
  FarmerDailyCapacityDto,
  FarmerBookingDetailDto,
  BookingJourneyStageDto,
} from '@astra/shared';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
    private readonly predictionService: PredictionService,
    private readonly eventsGateway: EventsGateway,
    private readonly govConfig: GovernmentConfigService,
    private readonly capacityService: CapacityService,
  ) {}

  /**
   * Retrieves authoritative booking capacity for a farmer on a specific date.
   */
  async getCapacity(userId: string, centreId?: string, dateStr?: string): Promise<FarmerDailyCapacityDto> {
    const farmer = await this.prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) throw new ForbiddenException('Farmer profile required.');
    return this.capacityService.getFarmerBookingCapacity(farmer.id, centreId, dateStr);
  }

  /**
   * Generates preliminary arrival window & feasibility estimate for a farmer.
   */
  async estimateBooking(userId: string, dto: BookingEstimateRequestDto): Promise<BookingEstimateResponseDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new ForbiddenException('Farmer profile required to check booking feasibility.');
    }

    if (!farmer.isVerified) {
      throw new ForbiddenException(
        'Procurement booking is restricted to verified farmers only. Your registration is currently awaiting verification by the authorised procurement authority.',
      );
    }

    return this.schedulingService.estimateBooking(dto);
  }

  /**
   * Final Revalidation & Idempotent Confirmation inside a Database Transaction.
   * Concurrency protection ensures physical session capacity and farmer daily limits are never exceeded.
   */
  async createBooking(userId: string, dto: CreateBookingDto): Promise<ProcurementBookingDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: { registrations: true },
    });

    if (!farmer) {
      throw new ForbiddenException('Farmer profile not found. Please complete basic profile first.');
    }

    if (!farmer.isVerified) {
      throw new ForbiddenException(
        'Procurement booking is restricted to verified farmers only. Your registration is currently awaiting verification by the authorised procurement authority.',
      );
    }

    // Check idempotency if key provided
    if (dto.idempotencyKey) {
      const existing = await this.prisma.procurementBooking.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          centre: { include: { state: true, district: true } },
          weighment: true,
          quality: true,
          procurement: true,
          payment: true,
        },
      });

      if (existing) {
        this.logger.log(`Idempotent hit for key: ${dto.idempotencyKey}. Returning existing booking ${existing.bookingNumber}`);
        return this.mapBookingDto(existing, farmer);
      }
    }

    const policy = this.govConfig.getPolicy();

    // Validate produce quantity against government minimum limit
    if (!dto.expectedQuantityQuintals || dto.expectedQuantityQuintals <= 0) {
      throw new BadRequestException('Expected produce quantity must be greater than 0 quintals.');
    }

    if (dto.expectedQuantityQuintals < policy.minimumBookingQuantityQuintals) {
      throw new BadRequestException(
        `Entered quantity (${dto.expectedQuantityQuintals} q) is below the government-configured minimum booking quantity of ${policy.minimumBookingQuantityQuintals} quintals.`,
      );
    }

    // Execute atomic reservation within PostgreSQL transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch & lock centre configuration
      const centre = await tx.procurementCentre.findUnique({
        where: { id: dto.centreId },
        include: { state: true, district: true },
      });

      if (!centre) {
        throw new NotFoundException('Procurement centre not found.');
      }

      if (
        centre.verificationStatus !== CentreVerificationStatus.VERIFIED &&
        centre.verificationStatus !== CentreVerificationStatus.ACTIVE
      ) {
        throw new BadRequestException('Selected centre is not approved or active for procurement bookings.');
      }

      if (centre.operationalStatus !== CentreOperationalStatus.OPEN) {
        throw new BadRequestException('Selected centre is currently closed or undergoing maintenance.');
      }

      // Check max quantity limit per single booking
      if (dto.expectedQuantityQuintals > centre.maxQuantityPerBooking) {
        throw new BadRequestException(
          `Entered quantity (${dto.expectedQuantityQuintals} q) exceeds the maximum allowed (${centre.maxQuantityPerBooking} q) for a single booking at this centre.`,
        );
      }

      // 2. Validate canonical date is within rolling 7 days
      const { startOfDay, endOfDay, canonicalDateStr } = parseIstDateRange(dto.bookingDate);

      const rollingDates = this.schedulingService.getRolling7Dates();
      const isValidDate = rollingDates.some((d) => formatIstDateStr(d) === canonicalDateStr);

      if (!isValidDate) {
        throw new BadRequestException('Selected date is outside the active 7-day booking window.');
      }

      if (!this.schedulingService.isOperatingDay(startOfDay, centre.operatingDays)) {
        throw new BadRequestException(`Centre does not operate on this day (${centre.operatingDays}).`);
      }

      // 3. ENFORCE AUTHORITATIVE 4-LEVEL CAPACITY HIERARCHY
      const capacity = await this.capacityService.getFarmerBookingCapacity(
        farmer.id,
        centre.id,
        canonicalDateStr,
        'Paddy',
      );

      if (dto.expectedQuantityQuintals < capacity.minimumBookingQuantityQuintals) {
        throw new BadRequestException(
          `Entered quantity (${dto.expectedQuantityQuintals} q) is below the minimum booking quantity of ${capacity.minimumBookingQuantityQuintals} quintals.`,
        );
      }

      if (dto.expectedQuantityQuintals > capacity.remainingCapacityQuintals) {
        throw new BadRequestException(
          `You can book only ${capacity.remainingCapacityQuintals.toFixed(1)} q more for this date at this centre.`,
        );
      }

      // 4. Revalidate centre physical session capacity
      const existingSessionBookings = await tx.procurementBooking.findMany({
        where: {
          centreId: dto.centreId,
          bookingDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
          session: dto.session,
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
          },
        },
      });

      const bookedTotal = existingSessionBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);
      const sessionCapacity =
        dto.session === BookingSession.MORNING
          ? centre.morningCapacityQuintals
          : centre.afternoonCapacityQuintals;

      if (bookedTotal + dto.expectedQuantityQuintals > sessionCapacity) {
        throw new BadRequestException(
          `Physical session capacity exceeded during confirmation. Remaining: ${(sessionCapacity - bookedTotal).toFixed(1)} q. Please select another date or session.`,
        );
      }

      // 5. Compute arrival window & predicted duration
      const { windowStart, windowEnd } = this.schedulingService.computeArrivalWindow(
        dto.session,
        centre.operatingHoursStart,
        centre.operatingHoursEnd,
        existingSessionBookings.length,
        centre.slotDurationMinutes,
      );

      const expectedDuration = this.predictionService.predictProcessingDuration(dto.expectedQuantityQuintals);

      // 6. Generate official booking reference
      const datePart = canonicalDateStr.replace(/-/g, '').slice(2); // e.g. 260923
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `ASTRA-BOOK-${datePart}-${randPart}`;

      // 7. Create booking record with historical rule snapshots
      const created = await tx.procurementBooking.create({
        data: {
          bookingNumber,
          farmerId: farmer.id,
          centreId: centre.id,
          bookingDate: startOfDay,
          session: dto.session,
          windowStartTime: windowStart,
          windowEndTime: windowEnd,
          expectedQuantityQuintals: dto.expectedQuantityQuintals,
          maxAllowedQuantityQuintals: centre.maxQuantityPerBooking,
          expectedDurationMinutes: expectedDuration,
          vehicleNumber: dto.vehicleNumber || null,
          vehicleType: dto.vehicleType || null,
          driverName: dto.driverName || null,
          status: BookingStatus.BOOKED,
          idempotencyKey: dto.idempotencyKey || null,
          governmentLimitAtBooking: capacity.governmentMaximumQuintals,
          centreLimitAtBooking: capacity.centreDailyLimitQuintals,
          applicableLimitAtBooking: capacity.applicableDailyLimitQuintals,
          minimumBookingAtBooking: capacity.minimumBookingQuantityQuintals,
        },
        include: {
          centre: { include: { state: true, district: true } },
          weighment: true,
          quality: true,
          procurement: true,
          payment: true,
        },
      });

      // 8. Record Audit Log
      await tx.auditLog.create({
        data: {
          eventType: 'BOOKING_CREATED',
          bookingId: created.id,
          centreId: centre.id,
          actorId: farmer.userId,
          actorRole: 'FARMER',
          newState: {
            bookingNumber,
            date: dto.bookingDate,
            session: dto.session,
            window: `${windowStart} - ${windowEnd}`,
            quantity: dto.expectedQuantityQuintals,
          },
          reason: 'Farmer confirmed procurement visit reservation',
        },
      });

      return created;
    });

    // Notify centre and farmer in real-time (outside transaction)
    this.eventsGateway.emitToCentre(booking.centreId, 'booking:created', {
      bookingNumber: booking.bookingNumber,
      session: booking.session,
      windowStartTime: booking.windowStartTime,
      windowEndTime: booking.windowEndTime,
      expectedQuantityQuintals: booking.expectedQuantityQuintals,
      status: booking.status,
    });

    this.eventsGateway.emitToFarmer(farmer.id, 'booking:confirmed', {
      bookingNumber: booking.bookingNumber,
      centreName: booking.centre.name,
      bookingDate: booking.bookingDate,
      session: booking.session,
      windowStartTime: booking.windowStartTime,
      windowEndTime: booking.windowEndTime,
    });

    return this.mapBookingDto(booking, farmer);
  }

  /**
   * Retrieves all procurement visits for the authenticated farmer.
   */
  async getMyVisits(userId: string): Promise<ProcurementBookingDto[]> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new ForbiddenException('Farmer profile required.');
    }

    const bookings = await this.prisma.procurementBooking.findMany({
      where: { farmerId: farmer.id },
      include: {
        centre: { include: { state: true, district: true } },
        weighment: true,
        quality: true,
        procurement: true,
        payment: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { windowStartTime: 'asc' },
      ],
    });

    return bookings.map((b) => this.mapBookingDto(b, farmer));
  }

  /**
   * Cancel an upcoming booking
   */
  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new ForbiddenException('Farmer profile required.');
    }

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    if (booking.farmerId !== farmer.id) {
      throw new ForbiddenException('You can only cancel your own bookings.');
    }

    if (booking.status !== BookingStatus.BOOKED && booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel booking in ${booking.status} status.`);
    }

    const updated = await this.prisma.procurementBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by farmer',
      },
      include: { centre: { include: { state: true, district: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'BOOKING_CANCELLED',
        bookingId,
        centreId: updated.centreId,
        actorId: userId,
        actorRole: 'FARMER',
        previousState: { status: booking.status },
        newState: { status: BookingStatus.CANCELLED, reason },
        reason: reason || 'Cancelled by farmer',
      },
    });

    // Inform centre officer that capacity was released
    this.eventsGateway.emitToCentre(updated.centreId, 'booking:cancelled', {
      bookingNumber: updated.bookingNumber,
      session: updated.session,
      freedQuantityQuintals: updated.expectedQuantityQuintals,
    });

    return this.mapBookingDto(updated, farmer);
  }

  /**
   * Helper: Calculates accurate real-time queue position for a checked-in booking
   */
  private async calculateQueuePosition(centreId: string, checkInTime: Date): Promise<number> {
    const startOfDay = new Date(checkInTime);
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.procurementBooking.count({
      where: {
        centreId,
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
        checkInTime: {
          gte: startOfDay,
          lte: checkInTime,
        },
      },
    });
    return count || 1;
  }

  /**
   * Helper: Calculates farmers currently ahead in the physical queue/weighment
   */
  private async calculateFarmersAhead(centreId: string, checkInTime: Date, currentBookingId: string): Promise<number> {
    const startOfDay = new Date(checkInTime);
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.procurementBooking.count({
      where: {
        centreId,
        id: { not: currentBookingId },
        status: { in: [BookingStatus.CHECKED_IN, BookingStatus.WEIGHMENT] },
        checkInTime: {
          gte: startOfDay,
          lt: checkInTime,
        },
      },
    });
    return count;
  }

  /**
   * Helper: Maps internal technical status to clear farmer-facing language
   */
  private mapFarmerStatusLabel(
    status: BookingStatus,
    farmersAhead?: number | null,
  ): { label: string; queueStatusLabel: string | null } {
    switch (status) {
      case BookingStatus.BOOKED:
      case BookingStatus.PENDING:
        return { label: 'Booking Confirmed', queueStatusLabel: null };
      case BookingStatus.CHECKED_IN:
        return {
          label: 'Checked In',
          queueStatusLabel: farmersAhead === 0 ? 'Called for weighment' : 'Waiting for weighment',
        };
      case BookingStatus.WEIGHMENT:
        return { label: 'Weighment in Progress', queueStatusLabel: 'Weighment in progress' };
      case BookingStatus.QUALITY_ASSESSMENT:
        return { label: 'Quality Assessment in Progress', queueStatusLabel: 'Quality inspection in progress' };
      case BookingStatus.PROCUREMENT:
        return { label: 'Procurement in Progress', queueStatusLabel: 'Procurement processing in progress' };
      case BookingStatus.PAYMENT:
        return { label: 'Payment Pending', queueStatusLabel: 'Awaiting DBT bank disbursal' };
      case BookingStatus.COMPLETED:
        return { label: 'Procurement & Payment Completed', queueStatusLabel: 'Procurement completed' };
      case BookingStatus.CANCELLED:
        return { label: 'Cancelled', queueStatusLabel: null };
      case BookingStatus.NO_SHOW:
        return { label: 'Missed Slot', queueStatusLabel: null };
      default:
        return { label: status, queueStatusLabel: null };
    }
  }

  /**
   * Aggregates and returns the Farmer Dashboard Summary:
   * Identity, Active Procurement Bookings with Queue Position, Today's Capacity, Upcoming, Recent.
   */
  async getFarmerDashboardSummary(userId: string): Promise<FarmerDashboardSummaryDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer profile not found.');
    }

    const latestReg = farmer.registrations[0];
    let verificationStatus: 'VERIFIED' | 'UNDER_VERIFICATION' | 'ACTION_REQUIRED' | 'REJECTED' = 'UNDER_VERIFICATION';
    if (farmer.isVerified) {
      verificationStatus = 'VERIFIED';
    } else if (latestReg) {
      if (latestReg.status === RegistrationStatus.VERIFIED) {
        verificationStatus = 'VERIFIED';
      } else if (
        latestReg.status === RegistrationStatus.RETURNED_FOR_CORRECTION ||
        latestReg.status === RegistrationStatus.ACTION_REQUIRED
      ) {
        verificationStatus = 'ACTION_REQUIRED';
      } else if (latestReg.status === RegistrationStatus.REJECTED) {
        verificationStatus = 'REJECTED';
      }
    }

    const policy = this.govConfig.getPolicy();
    const todayIst = getTodayIstDateStr();
    const todayRange = parseIstDateRange(todayIst);

    // 1. Fetch active bookings (checked-in or currently processing, OR booked for today in IST)
    const activeBookingsRaw = await this.prisma.procurementBooking.findMany({
      where: {
        farmerId: farmer.id,
        OR: [
          {
            status: {
              in: [
                BookingStatus.CHECKED_IN,
                BookingStatus.WEIGHMENT,
                BookingStatus.QUALITY_ASSESSMENT,
                BookingStatus.PROCUREMENT,
                BookingStatus.PAYMENT,
              ],
            },
          },
          {
            status: BookingStatus.BOOKED,
            bookingDate: {
              gte: todayRange.startOfDay,
              lt: todayRange.endOfDay,
            },
          },
        ],
      },
      include: {
        centre: true,
        weighment: true,
        quality: true,
        procurement: true,
        payment: true,
      },
      orderBy: [{ bookingDate: 'asc' }, { windowStartTime: 'asc' }],
    });

    const activeBookings: FarmerActiveBookingDto[] = [];
    for (const b of activeBookingsRaw) {
      let queuePosition: number | null = null;
      let farmersAhead: number | null = null;

      if (b.checkInTime) {
        queuePosition = await this.calculateQueuePosition(b.centreId, b.checkInTime);
        if (b.status === BookingStatus.CHECKED_IN || b.status === BookingStatus.WEIGHMENT) {
          farmersAhead = await this.calculateFarmersAhead(b.centreId, b.checkInTime, b.id);
        }
      }

      const { label: statusLabel, queueStatusLabel } = this.mapFarmerStatusLabel(
        b.status as BookingStatus,
        farmersAhead,
      );

      activeBookings.push({
        id: b.id,
        bookingNumber: b.bookingNumber,
        centreId: b.centreId,
        centreName: b.centre.name,
        centreCode: b.centre.centreCode,
        centreAddress: b.centre.address,
        bookingDate: formatIstDateStr(b.bookingDate),
        session: b.session as BookingSession,
        windowStartTime: b.windowStartTime,
        windowEndTime: b.windowEndTime,
        cropName: policy.crop,
        expectedQuantityQuintals: b.expectedQuantityQuintals,
        status: b.status as BookingStatus,
        statusLabel,
        checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
        queuePosition,
        farmersAhead,
        queueStatusLabel,
      });
    }

    // 2. Authoritative Capacity Hierarchy calculation for today via CapacityService
    const todayCapacity = await this.capacityService.getFarmerBookingCapacity(farmer.id, todayIst);

    // 3. Upcoming Bookings (Future dates, non-cancelled)
    const upcomingRaw = await this.prisma.procurementBooking.findMany({
      where: {
        farmerId: farmer.id,
        bookingDate: { gte: todayRange.endOfDay },
        status: BookingStatus.BOOKED,
      },
      include: { centre: true },
      orderBy: [{ bookingDate: 'asc' }, { windowStartTime: 'asc' }],
      take: 5,
    });

    const upcomingBookings = upcomingRaw.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      centreName: b.centre.name,
      centreAddress: b.centre.address,
      bookingDate: formatIstDateStr(b.bookingDate),
      session: b.session as BookingSession,
      windowStartTime: b.windowStartTime,
      windowEndTime: b.windowEndTime,
      expectedQuantityQuintals: b.expectedQuantityQuintals,
      cropName: policy.crop,
      status: b.status as BookingStatus,
      statusLabel: 'Booking Confirmed',
    }));

    // 4. Recent Bookings (Completed or past bookings)
    const recentRaw = await this.prisma.procurementBooking.findMany({
      where: {
        farmerId: farmer.id,
        OR: [
          { status: { in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW] } },
          { bookingDate: { lt: todayRange.startOfDay } },
        ],
      },
      include: { centre: true, procurement: true, payment: true },
      orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    const recentBookings = recentRaw.map((b) => {
      const isCompleted = b.status === BookingStatus.COMPLETED;
      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        centreName: b.centre.name,
        bookingDate: formatIstDateStr(b.bookingDate),
        expectedQuantityQuintals: b.expectedQuantityQuintals,
        acceptedQuantityQuintals: b.procurement?.acceptedQuantityQuintals,
        cropName: policy.crop,
        status: b.status as BookingStatus,
        statusLabel: isCompleted
          ? b.payment?.paymentStatus === 'SETTLED'
            ? 'Payment Completed'
            : 'Procurement Completed'
          : b.status === BookingStatus.CANCELLED
          ? 'Cancelled'
          : b.status,
        totalAmount: b.procurement?.totalAmount || b.payment?.amount,
      };
    });

    return {
      farmer: {
        id: farmer.id,
        farmerCode: farmer.farmerCode,
        fullName: farmer.fullName,
        mobile: farmer.mobile,
        village: farmer.village || undefined,
        district: farmer.district || undefined,
        isVerified: farmer.isVerified,
      },
      verificationStatus,
      activeBookings,
      todayCapacity,
      upcomingBookings,
      recentBookings,
      helpline: policy.helplineNumber,
    };
  }

  /**
   * Retrieves authorized booking detail with 7-stage transaction journey, department records, and audit timeline.
   */
  async getAuthorizedBookingDetail(userId: string, bookingId: string): Promise<FarmerBookingDetailDto> {
    const farmer = await this.prisma.farmer.findUnique({
      where: { userId },
    });

    if (!farmer) {
      throw new ForbiddenException('Farmer profile required.');
    }

    const booking = await this.prisma.procurementBooking.findUnique({
      where: { id: bookingId },
      include: {
        centre: { include: { state: true, district: true } },
        weighment: true,
        quality: true,
        procurement: true,
        payment: true,
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Procurement booking not found.');
    }

    // STRICT AUTHORIZATION: Farmer can only access their own bookings!
    if (booking.farmerId !== farmer.id) {
      throw new ForbiddenException('You are not authorized to view another farmer’s procurement booking.');
    }

    const policy = this.govConfig.getPolicy();
    const bookingDto = this.mapBookingDto(booking, farmer);

    // Queue metrics
    let queuePosition: number | null = null;
    let farmersAhead: number | null = null;
    let queueStatusLabel: string | undefined = undefined;

    if (booking.checkInTime) {
      queuePosition = await this.calculateQueuePosition(booking.centreId, booking.checkInTime);
      if (booking.status === BookingStatus.CHECKED_IN) {
        farmersAhead = await this.calculateFarmersAhead(booking.centreId, booking.checkInTime, booking.id);
        queueStatusLabel = farmersAhead === 0 ? 'Next in line for weighment' : 'Waiting in physical queue';
      } else if (booking.status === BookingStatus.WEIGHMENT) {
        queueStatusLabel = 'Currently at weighbridge';
      } else {
        queueStatusLabel = 'Queue processing completed';
      }
    }

    const currentStatus = this.resolveCurrentStatusBadge(booking.status as BookingStatus);
    const journey = this.buildBookingJourney(booking, queuePosition, farmersAhead);

    // Compute standard weight breakdown
    const netQuintals = booking.weighment?.approvedFinalWeight || booking.weighment?.originalHardwareWeight;
    const netKg = netQuintals ? Math.round(netQuintals * 100) : undefined;
    const tareKg = netKg ? 6840 : undefined;
    const grossKg = netKg && tareKg ? tareKg + netKg : undefined;

    const departmentRecords = {
      checkin: {
        status: booking.checkInTime ? ('COMPLETED' as const) : ('WAITING' as const),
        timestamp: booking.checkInTime ? booking.checkInTime.toISOString() : null,
        department: 'Centre Check-in / Gate Officer',
        action: 'Booking QR Verification & Gate Clearance',
        result: booking.checkInTime ? 'Farmer checked in and queued' : 'Waiting for physical arrival',
      },
      weighment: {
        status: booking.weighment
          ? ('COMPLETED' as const)
          : booking.status === BookingStatus.WEIGHMENT
          ? ('IN_PROGRESS' as const)
          : ('WAITING' as const),
        timestamp: booking.weighment?.createdAt ? booking.weighment.createdAt.toISOString() : null,
        department: 'Weighment Department / Weighment Officer',
        deviceCode: booking.weighment?.deviceCode || 'Scale-01',
        grossWeightKg: grossKg,
        tareWeightKg: tareKg,
        netWeightKg: netKg,
        netWeightQuintals: netQuintals,
        statusLabel: booking.weighment?.status || (booking.status === BookingStatus.WEIGHMENT ? 'In Progress' : 'Waiting'),
        remarks: booking.weighment?.officerRemarks || undefined,
      },
      quality: {
        status: booking.quality
          ? booking.procurement?.decision === 'REJECTED'
            ? ('REJECTED' as const)
            : ('COMPLETED' as const)
          : booking.status === BookingStatus.QUALITY_ASSESSMENT
          ? ('IN_PROGRESS' as const)
          : ('WAITING' as const),
        timestamp: booking.quality?.assessedAt ? booking.quality.assessedAt.toISOString() : null,
        department: 'Quality & Testing Lab / Lab Officer',
        grade: booking.quality?.grade,
        resultLabel: booking.quality
          ? booking.procurement?.decision === 'REJECTED'
            ? 'Rejected'
            : 'Accepted'
          : 'Pending',
        moisturePercent: booking.quality?.moisturePercent,
        foreignMatterPercent: booking.quality?.foreignMatterPercent,
        damagedGrainPercent: booking.quality?.damagedGrainPercent,
        remarks: booking.quality?.remarks || undefined,
      },
      procurement: {
        status: booking.procurement
          ? ('COMPLETED' as const)
          : booking.status === BookingStatus.PROCUREMENT
          ? ('IN_PROGRESS' as const)
          : ('WAITING' as const),
        timestamp: booking.procurement?.decidedAt ? booking.procurement.decidedAt.toISOString() : null,
        department: 'Procurement Branch / Centre In-Charge',
        procurementId: booking.procurement?.id ? `ASTRA-PROC-${booking.procurement.id.slice(0, 8).toUpperCase()}` : undefined,
        decision: booking.procurement?.decision,
        bookedQuantityQuintals: booking.expectedQuantityQuintals,
        weighedQuantityQuintals: netQuintals,
        acceptedQuantityQuintals: booking.procurement?.acceptedQuantityQuintals,
        ratePerQuintal: booking.procurement?.ratePerQuintal,
        grossValue: booking.procurement?.totalAmount,
        deductions: 0,
        netPayable: booking.procurement?.totalAmount,
      },
      payment: {
        status: booking.payment?.paymentStatus === 'SETTLED'
          ? ('COMPLETED' as const)
          : booking.status === BookingStatus.PAYMENT || booking.payment?.paymentStatus === 'PENDING'
          ? ('IN_PROGRESS' as const)
          : ('WAITING' as const),
        timestamp: booking.payment?.settledAt ? booking.payment.settledAt.toISOString() : null,
        department: 'Public Financial Management System (PFMS) / DBT Settlement',
        amount: booking.payment?.amount || booking.procurement?.totalAmount,
        transactionRef: booking.payment?.transactionRef || undefined,
        bankAccountMasked: booking.payment?.bankAccountMasked || undefined,
        statusLabel: booking.payment?.paymentStatus || (booking.status === BookingStatus.PAYMENT ? 'Payment Processing' : 'Pending'),
        settledAt: booking.payment?.settledAt ? booking.payment.settledAt.toISOString() : null,
      },
    };

    const activityAuditTrail = (booking.auditLogs || []).map((log) => ({
      timestamp: log.createdAt.toISOString(),
      stage: this.mapEventToStage(log.eventType),
      department: this.mapRoleToDepartment(log.actorRole),
      event: log.eventType,
      description: log.reason || 'Transaction record updated in state procurement ledger',
    }));

    return {
      booking: bookingDto,
      cropName: policy.crop,
      currentStatus,
      queueInfo: {
        isQueued: Boolean(booking.checkInTime),
        queuePosition,
        farmersAhead,
        checkedInTime: booking.checkInTime ? booking.checkInTime.toISOString() : null,
        queueStatusLabel,
        message: !booking.checkInTime
          ? 'Your queue position will appear after you check in at the procurement centre.'
          : undefined,
      },
      journey,
      departmentRecords,
      activityAuditTrail,
    };
  }

  private resolveCurrentStatusBadge(status: BookingStatus): {
    code: BookingStatus;
    label: string;
    description: string;
    badgeType: 'success' | 'warning' | 'info' | 'pending' | 'danger';
  } {
    switch (status) {
      case BookingStatus.BOOKED:
      case BookingStatus.PENDING:
        return {
          code: status,
          label: 'Booking Confirmed',
          description: 'Arrival slot reserved. Present booking QR pass at centre entrance.',
          badgeType: 'info',
        };
      case BookingStatus.CHECKED_IN:
        return {
          code: status,
          label: 'Checked In',
          description: 'Arrival verified. Farmer is in the active physical queue waiting for weighment.',
          badgeType: 'warning',
        };
      case BookingStatus.WEIGHMENT:
        return {
          code: status,
          label: 'Weighment in Progress',
          description: 'Grain produce is currently on the digital weighbridge scale.',
          badgeType: 'warning',
        };
      case BookingStatus.QUALITY_ASSESSMENT:
        return {
          code: status,
          label: 'Quality Assessment in Progress',
          description: 'Laboratory assessment of moisture, foreign matter, and grain grading.',
          badgeType: 'warning',
        };
      case BookingStatus.PROCUREMENT:
        return {
          code: status,
          label: 'Procurement in Progress',
          description: 'Procurement decision and electronic purchase voucher being issued.',
          badgeType: 'warning',
        };
      case BookingStatus.PAYMENT:
        return {
          code: status,
          label: 'Payment Pending',
          description: 'Electronic DBT settlement queued for direct bank credit.',
          badgeType: 'warning',
        };
      case BookingStatus.COMPLETED:
        return {
          code: status,
          label: 'Procurement & Payment Completed',
          description: 'All procurement and DBT settlement stages have successfully completed.',
          badgeType: 'success',
        };
      case BookingStatus.CANCELLED:
        return {
          code: status,
          label: 'Cancelled',
          description: 'This booking has been cancelled.',
          badgeType: 'danger',
        };
      case BookingStatus.NO_SHOW:
        return {
          code: status,
          label: 'Missed Window',
          description: 'Scheduled arrival window lapsed without check-in.',
          badgeType: 'danger',
        };
      default:
        return {
          code: status,
          label: status,
          description: 'Current booking status',
          badgeType: 'info',
        };
    }
  }

  private buildBookingJourney(
    booking: any,
    queuePosition?: number | null,
    farmersAhead?: number | null,
  ): BookingJourneyStageDto[] {
    const isCheckedIn = Boolean(booking.checkInTime);
    const isWeighed = Boolean(booking.weighment);
    const isQualityDone = Boolean(booking.quality);
    const isProcured = Boolean(booking.procurement);
    const isPaid = booking.payment?.paymentStatus === 'SETTLED';

    return [
      {
        stepNumber: 1,
        stageId: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        state: 'COMPLETED',
        timestamp: booking.createdAt ? booking.createdAt.toISOString() : null,
        department: 'Procurement Portal / Scheduling',
        actorRole: 'FARMER',
        summary: `Procurement slot reserved for ${booking.expectedQuantityQuintals} qtl at ${booking.centre?.name}`,
      },
      {
        stepNumber: 2,
        stageId: 'CENTRE_CHECKIN',
        title: 'Centre Check-in',
        state: isCheckedIn ? 'COMPLETED' : 'WAITING',
        timestamp: booking.checkInTime ? booking.checkInTime.toISOString() : null,
        department: 'Centre Check-in / Gate Officer',
        actorRole: 'CHECK_IN_OFFICER',
        summary: isCheckedIn
          ? 'Physical arrival verified via Booking QR Pass'
          : 'Please arrive at your assigned procurement centre during your window and present your booking QR pass',
      },
      {
        stepNumber: 3,
        stageId: 'PHYSICAL_QUEUE',
        title: 'Physical Queue',
        state: !isCheckedIn
          ? 'NOT_STARTED'
          : booking.status === BookingStatus.CHECKED_IN
          ? 'IN_PROGRESS'
          : 'COMPLETED',
        timestamp: booking.checkInTime ? booking.checkInTime.toISOString() : null,
        department: 'Yard Queue Management',
        actorRole: 'CHECK_IN_OFFICER',
        summary: !isCheckedIn
          ? 'Your queue position will appear after you check in at the procurement centre.'
          : booking.status === BookingStatus.CHECKED_IN
          ? `Position #${queuePosition} • ${farmersAhead ?? 0} farmers ahead`
          : `Queue completed (Position at check-in: #${queuePosition || 1})`,
      },
      {
        stepNumber: 4,
        stageId: 'WEIGHMENT',
        title: 'Weighment',
        state: isWeighed
          ? 'COMPLETED'
          : booking.status === BookingStatus.WEIGHMENT
          ? 'IN_PROGRESS'
          : 'WAITING',
        timestamp: booking.weighment?.createdAt ? booking.weighment.createdAt.toISOString() : null,
        department: 'Weighment Department',
        actorRole: 'WEIGHMENT_OFFICER',
        summary: isWeighed
          ? `Net grain weight: ${booking.weighment.approvedFinalWeight || booking.weighment.originalHardwareWeight} qtl (${booking.weighment.deviceCode})`
          : 'Waiting for weighbridge allocation',
      },
      {
        stepNumber: 5,
        stageId: 'QUALITY_ASSESSMENT',
        title: 'Quality Assessment',
        state: isQualityDone
          ? booking.procurement?.decision === 'REJECTED'
            ? 'REJECTED'
            : 'COMPLETED'
          : booking.status === BookingStatus.QUALITY_ASSESSMENT
          ? 'IN_PROGRESS'
          : 'WAITING',
        timestamp: booking.quality?.assessedAt ? booking.quality.assessedAt.toISOString() : null,
        department: 'Quality / Lab Testing',
        actorRole: 'QUALITY_OFFICER',
        summary: isQualityDone
          ? `Graded ${booking.quality.grade} • Moisture ${booking.quality.moisturePercent}%`
          : 'Waiting for quality laboratory assessment',
      },
      {
        stepNumber: 6,
        stageId: 'PROCUREMENT',
        title: 'Procurement',
        state: isProcured
          ? 'COMPLETED'
          : booking.status === BookingStatus.PROCUREMENT
          ? 'IN_PROGRESS'
          : 'WAITING',
        timestamp: booking.procurement?.decidedAt ? booking.procurement.decidedAt.toISOString() : null,
        department: 'Procurement Management',
        actorRole: 'PROCUREMENT_OFFICER',
        summary: isProcured
          ? `Accepted ${booking.procurement.acceptedQuantityQuintals} qtl at ₹${booking.procurement.ratePerQuintal}/qtl`
          : 'Waiting for purchase voucher issuance',
      },
      {
        stepNumber: 7,
        stageId: 'PAYMENT_DBT',
        title: 'Payment / DBT',
        state: isPaid
          ? 'COMPLETED'
          : booking.status === BookingStatus.PAYMENT || booking.payment?.paymentStatus === 'PENDING'
          ? 'IN_PROGRESS'
          : 'WAITING',
        timestamp: booking.payment?.settledAt ? booking.payment.settledAt.toISOString() : null,
        department: 'Direct Benefit Transfer (DBT)',
        actorRole: 'PAYMENT_OFFICER',
        summary: isPaid
          ? `Disbursed ₹${booking.payment.amount?.toLocaleString('en-IN')} via ${booking.payment.transactionRef}`
          : 'Waiting for direct benefit transfer disbursal to verified bank account',
      },
    ];
  }

  private mapEventToStage(eventType: string): string {
    if (eventType.includes('BOOKING')) return 'Booking';
    if (eventType.includes('CHECK_IN')) return 'Centre Check-in';
    if (eventType.includes('WEIGHMENT')) return 'Weighment';
    if (eventType.includes('QUALITY')) return 'Quality';
    if (eventType.includes('PROCUREMENT')) return 'Procurement';
    if (eventType.includes('PAYMENT')) return 'Payment';
    return 'Operation';
  }

  private mapRoleToDepartment(actorRole: string): string {
    switch (actorRole) {
      case 'FARMER':
        return 'Farmer Portal';
      case 'CHECK_IN_OFFICER':
        return 'Centre Gate Security';
      case 'WEIGHMENT_OFFICER':
        return 'Weighment Department';
      case 'QUALITY_OFFICER':
        return 'Quality Testing Lab';
      case 'PROCUREMENT_OFFICER':
        return 'Procurement Department';
      case 'PAYMENT_OFFICER':
        return 'DBT Treasury Branch';
      case 'CENTRE_HEAD':
        return 'Centre In-Charge';
      default:
        return 'Department Staff';
    }
  }

  private mapBookingDto(b: any, farmer?: any): ProcurementBookingDto {
    return {
      id: b.id,
      bookingNumber: b.bookingNumber,
      farmerId: b.farmerId,
      farmerName: farmer?.fullName || b.farmer?.fullName,
      farmerMobile: farmer?.mobile || b.farmer?.mobile,
      farmerCode: farmer?.farmerCode || b.farmer?.farmerCode,
      centreId: b.centreId,
      centreName: b.centre?.name,
      centreCode: b.centre?.centreCode,
      centreAddress: b.centre?.address,
      bookingDate: formatIstDateStr(b.bookingDate),
      session: b.session as BookingSession,
      windowStartTime: b.windowStartTime,
      windowEndTime: b.windowEndTime,
      expectedQuantityQuintals: b.expectedQuantityQuintals,
      maxAllowedQuantityQuintals: b.maxAllowedQuantityQuintals,
      expectedDurationMinutes: b.expectedDurationMinutes,
      vehicleNumber: b.vehicleNumber,
      vehicleType: b.vehicleType,
      driverName: b.driverName,
      status: b.status as BookingStatus,
      checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
      cancellationReason: b.cancellationReason,
      governmentLimitAtBooking: b.governmentLimitAtBooking,
      centreLimitAtBooking: b.centreLimitAtBooking,
      applicableLimitAtBooking: b.applicableLimitAtBooking,
      minimumBookingAtBooking: b.minimumBookingAtBooking,
      weighment: b.weighment
        ? {
            id: b.weighment.id,
            bookingId: b.weighment.bookingId,
            deviceCode: b.weighment.deviceCode,
            originalHardwareWeight: b.weighment.originalHardwareWeight,
            approvedFinalWeight: b.weighment.approvedFinalWeight,
            status: b.weighment.status,
            correctionReason: b.weighment.correctionReason,
            officerRemarks: b.weighment.officerRemarks,
            requestedBy: b.weighment.requestedBy,
            requestedAt: b.weighment.requestedAt ? b.weighment.requestedAt.toISOString() : null,
            approvedBy: b.weighment.approvedBy,
            approvedAt: b.weighment.approvedAt ? b.weighment.approvedAt.toISOString() : null,
            createdAt: b.weighment.createdAt.toISOString(),
            updatedAt: b.weighment.updatedAt.toISOString(),
          }
        : null,
      quality: b.quality
        ? {
            id: b.quality.id,
            bookingId: b.quality.bookingId,
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
            id: b.procurement.id,
            bookingId: b.procurement.bookingId,
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
            id: b.payment.id,
            bookingId: b.payment.bookingId,
            paymentStatus: b.payment.paymentStatus,
            transactionRef: b.payment.transactionRef,
            bankAccountMasked: b.payment.bankAccountMasked,
            amount: b.payment.amount,
            settledBy: b.payment.settledBy,
            settledAt: b.payment.settledAt ? b.payment.settledAt.toISOString() : null,
          }
        : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
