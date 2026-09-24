import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PredictionService } from './prediction.service';
import {
  BookingSession,
  BookingStatus,
  CentreVerificationStatus,
  CentreOperationalStatus,
  BookingEstimateRequestDto,
  BookingEstimateResponseDto,
  DaySessionAvailability,
} from '@astra/shared';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly predictionService: PredictionService,
  ) {}

  /**
   * Generates the rolling 7-day booking window starting from today.
   */
  getRolling7Dates(): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    for (let i = 0; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
    return dates;
  }

  /**
   * Checks if a date falls on an operating day for the centre.
   */
  isOperatingDay(date: Date, operatingDaysStr: string): boolean {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = dayNames[date.getDay()];
    // Standard default: "Monday - Saturday"
    if (operatingDaysStr.toLowerCase().includes('monday - saturday')) {
      return day !== 'Sunday';
    }
    if (operatingDaysStr.toLowerCase().includes('all days') || operatingDaysStr.toLowerCase().includes('monday - sunday')) {
      return true;
    }
    return operatingDaysStr.toLowerCase().includes(day.toLowerCase());
  }

  /**
   * Retrieves 7-day session availability for a verified and active centre.
   */
  async getCentre7DayAvailability(centreId: string): Promise<DaySessionAvailability[]> {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new NotFoundException(`Procurement centre not found: ${centreId}`);
    }

    const rollingDates = this.getRolling7Dates();
    const startDate = rollingDates[0];
    const endDate = new Date(rollingDates[rollingDates.length - 1]);
    endDate.setHours(23, 59, 59, 999);

    // Fetch existing active bookings for this date range
    const existingBookings = await this.prisma.procurementBooking.findMany({
      where: {
        centreId,
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
        },
      },
      select: {
        bookingDate: true,
        session: true,
        expectedQuantityQuintals: true,
      },
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return rollingDates.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = dayNames[date.getDay()];
      const isOperating = this.isOperatingDay(date, centre.operatingDays);

      // Sum existing session quantities
      const dayBookings = existingBookings.filter((b) => {
        const bDateStr = new Date(b.bookingDate).toISOString().split('T')[0];
        return bDateStr === dateStr;
      });

      const morningBooked = dayBookings
        .filter((b) => b.session === BookingSession.MORNING)
        .reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);

      const afternoonBooked = dayBookings
        .filter((b) => b.session === BookingSession.AFTERNOON)
        .reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);

      const morningRemaining = Math.max(0, centre.morningCapacityQuintals - morningBooked);
      const afternoonRemaining = Math.max(0, centre.afternoonCapacityQuintals - afternoonBooked);

      return {
        date: dateStr,
        dayOfWeek,
        isOperatingDay: isOperating,
        morning: {
          available: isOperating && morningRemaining >= 5, // minimum 5 quintals to be bookable
          remainingCapacityQuintals: Math.round(morningRemaining * 100) / 100,
          totalCapacityQuintals: centre.morningCapacityQuintals,
        },
        afternoon: {
          available: isOperating && afternoonRemaining >= 5,
          remainingCapacityQuintals: Math.round(afternoonRemaining * 100) / 100,
          totalCapacityQuintals: centre.afternoonCapacityQuintals,
        },
      };
    });
  }

  /**
   * Generates a feasible arrival window estimate for a requested date, session, and quantity.
   */
  async estimateBooking(dto: BookingEstimateRequestDto): Promise<BookingEstimateResponseDto> {
    const centre = await this.prisma.procurementCentre.findUnique({
      where: { id: dto.centreId },
    });

    if (!centre) {
      throw new NotFoundException(`Procurement centre not found: ${dto.centreId}`);
    }

    if (
      centre.verificationStatus !== CentreVerificationStatus.VERIFIED &&
      centre.verificationStatus !== CentreVerificationStatus.ACTIVE
    ) {
      throw new BadRequestException('This centre is not currently verified or approved for bookings.');
    }

    if (centre.operationalStatus !== CentreOperationalStatus.OPEN) {
      throw new BadRequestException('This centre is temporarily unavailable for procurement visits.');
    }

    // Validate quantity
    if (dto.expectedQuantityQuintals <= 0) {
      throw new BadRequestException('Produce quantity must be greater than 0 quintals.');
    }

    if (dto.expectedQuantityQuintals > centre.maxQuantityPerBooking) {
      throw new BadRequestException(
        `Entered quantity (${dto.expectedQuantityQuintals} q) exceeds the maximum allowed (${centre.maxQuantityPerBooking} q) for this procurement booking.`,
      );
    }

    // Validate date falls in next 7 days
    const reqDate = new Date(dto.bookingDate);
    reqDate.setHours(0, 0, 0, 0);

    const rollingDates = this.getRolling7Dates();
    const isValidWindow = rollingDates.some((d) => d.toISOString().split('T')[0] === dto.bookingDate);

    if (!isValidWindow) {
      throw new BadRequestException(
        'Selected date is outside the active 7-day booking calendar. Please choose a date within the next 7 days.',
      );
    }

    if (!this.isOperatingDay(reqDate, centre.operatingDays)) {
      throw new BadRequestException(`Centre is closed on ${dto.bookingDate} (${centre.operatingDays}).`);
    }

    // Check session capacity
    const nextDay = new Date(reqDate);
    nextDay.setDate(reqDate.getDate() + 1);

    const activeBookings = await this.prisma.procurementBooking.findMany({
      where: {
        centreId: dto.centreId,
        bookingDate: {
          gte: reqDate,
          lt: nextDay,
        },
        session: dto.session,
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
        },
      },
      orderBy: {
        windowStartTime: 'asc',
      },
    });

    const bookedQuintals = activeBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);
    const sessionCapacity =
      dto.session === BookingSession.MORNING
        ? centre.morningCapacityQuintals
        : centre.afternoonCapacityQuintals;

    const remainingCapacity = sessionCapacity - bookedQuintals;

    if (remainingCapacity < dto.expectedQuantityQuintals) {
      return {
        centreId: centre.id,
        centreName: centre.name,
        bookingDate: dto.bookingDate,
        session: dto.session,
        expectedQuantityQuintals: dto.expectedQuantityQuintals,
        assignedWindowStart: '00:00',
        assignedWindowEnd: '00:00',
        expectedDurationMinutes: 0,
        isFeasible: false,
        remainingSessionCapacityQuintals: Math.max(0, Math.round(remainingCapacity * 100) / 100),
        sessionCapacityQuintals: sessionCapacity,
        notes: `Physical ${dto.session.toLowerCase()} session capacity exceeded (Remaining: ${Math.max(0, remainingCapacity).toFixed(1)} q). Please select another session or date.`,
      };
    }

    // Constraint Scheduler: Allocate 15-minute arrival window within session
    const { windowStart, windowEnd } = this.computeArrivalWindow(
      dto.session,
      centre.operatingHoursStart,
      centre.operatingHoursEnd,
      activeBookings.length,
      centre.slotDurationMinutes,
    );

    const expectedDuration = this.predictionService.predictProcessingDuration(dto.expectedQuantityQuintals);

    return {
      centreId: centre.id,
      centreName: centre.name,
      bookingDate: dto.bookingDate,
      session: dto.session,
      expectedQuantityQuintals: dto.expectedQuantityQuintals,
      assignedWindowStart: windowStart,
      assignedWindowEnd: windowEnd,
      expectedDurationMinutes: expectedDuration,
      isFeasible: true,
      remainingSessionCapacityQuintals: Math.round((remainingCapacity - dto.expectedQuantityQuintals) * 100) / 100,
      sessionCapacityQuintals: sessionCapacity,
      notes: `Assigned 15-minute arrival window: ${windowStart} – ${windowEnd}. Expected duration: ~${expectedDuration} mins.`,
    };
  }

  /**
   * Deterministic constraint scheduler: distributes arrival windows across session hours.
   */
  computeArrivalWindow(
    session: BookingSession,
    opStart: string,
    opEnd: string,
    existingCountInSession: number,
    slotMinutes: number = 15,
  ): { windowStart: string; windowEnd: string } {
    let sessionStartHour = session === BookingSession.MORNING ? 8 : 13;
    let sessionStartMinute = 0;
    const sessionDurationMinutes = session === BookingSession.MORNING ? 300 : 240; // Morning 8-13 (5h), Afternoon 13-17 (4h)

    // Calculate slot index based on existing bookings
    const slotsAvailable = Math.floor(sessionDurationMinutes / slotMinutes);
    const slotIndex = existingCountInSession % slotsAvailable;

    const offsetMinutes = slotIndex * slotMinutes;
    const totalStartMinutes = sessionStartHour * 60 + sessionStartMinute + offsetMinutes;
    const totalEndMinutes = totalStartMinutes + slotMinutes;

    const startH = Math.floor(totalStartMinutes / 60);
    const startM = totalStartMinutes % 60;
    const endH = Math.floor(totalEndMinutes / 60);
    const endM = totalEndMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      windowStart: `${pad(startH)}:${pad(startM)}`,
      windowEnd: `${pad(endH)}:${pad(endM)}`,
    };
  }
}
