import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../../realtime/events.gateway';
import { BookingStatus, CheckinValidateResponseDto, CheckinConfirmResponseDto } from '@astra/shared';

@Injectable()
export class CheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Helper to verify officer's assigned centre from session
   */
  async getOfficerCentre(userId: string) {
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
   * Clean and normalize raw QR token or manual booking reference
   */
  private normalizeReference(tokenOrNumber: string): string {
    if (!tokenOrNumber || typeof tokenOrNumber !== 'string') {
      throw new BadRequestException('Booking QR code or reference number is required.');
    }
    let ref = tokenOrNumber.trim();
    if (ref.startsWith('{') && ref.endsWith('}')) {
      try {
        const parsed = JSON.parse(ref);
        ref = parsed.token || parsed.bookingNumber || parsed.bookingId || ref;
      } catch {
        // ignore json parse error, use raw string
      }
    }
    if (ref.startsWith('ASTRA-BK-TOKEN:')) {
      ref = ref.slice('ASTRA-BK-TOKEN:'.length).trim();
    }
    return ref;
  }

  /**
   * Authoritative validation of scanned QR or manual booking reference
   */
  async validateBookingForCheckin(userId: string, rawInput: string): Promise<CheckinValidateResponseDto> {
    const centre = await this.getOfficerCentre(userId);
    const reference = this.normalizeReference(rawInput);

    const booking = await this.prisma.procurementBooking.findFirst({
      where: {
        OR: [
          { bookingNumber: reference },
          { id: reference },
        ],
      },
      include: {
        farmer: true,
        centre: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking could not be found.');
    }

    // 1. Critical Centre Security: check centre match
    if (booking.centreId !== centre.id) {
      throw new ForbiddenException('This booking is not assigned to this procurement centre.');
    }

    // 2. Cancellation check
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking has been cancelled.');
    }

    // 3. Farmer verification check
    if (!booking.farmer || !booking.farmer.isVerified) {
      throw new BadRequestException('Farmer verification is not complete.');
    }

    // 4. Double check-in check
    if (
      booking.status === BookingStatus.CHECKED_IN ||
      booking.status === BookingStatus.WEIGHMENT ||
      booking.status === BookingStatus.QUALITY_ASSESSMENT ||
      booking.status === BookingStatus.PROCUREMENT ||
      booking.status === BookingStatus.PAYMENT ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('This booking has already been checked in.');
    }

    if (booking.status !== BookingStatus.BOOKED && booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Booking is not eligible for check-in (Current status: ${booking.status}).`);
    }

    // 5. Date validation (scheduled for today)
    const now = new Date();
    const toDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const bDate = new Date(booking.bookingDate);
    const bookingDateStr = toDateKey(bDate);
    const todayStr = toDateKey(now);
    const isoBookingStr = bDate.toISOString().split('T')[0];
    const isoTodayStr = now.toISOString().split('T')[0];

    const isToday = bookingDateStr === todayStr || isoBookingStr === isoTodayStr || bookingDateStr === isoTodayStr || isoBookingStr === todayStr;
    if (!isToday) {
      throw new BadRequestException('This booking is not scheduled for today.');
    }

    // 6. Arrival Window calculation
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentMinutesTotal = currentHours * 60 + currentMinutes;

    const [startH, startM] = (booking.windowStartTime || '00:00').split(':').map(Number);
    const [endH, endM] = (booking.windowEndTime || '23:59').split(':').map(Number);
    const startMinutesTotal = (isNaN(startH) ? 0 : startH) * 60 + (isNaN(startM) ? 0 : startM);
    const endMinutesTotal = (isNaN(endH) ? 23 : endH) * 60 + (isNaN(endM) ? 59 : endM);

    let windowStatus: 'ON_TIME' | 'EARLY' | 'LATE' = 'ON_TIME';
    let windowMessage = 'Within scheduled arrival window';

    if (currentMinutesTotal < startMinutesTotal) {
      windowStatus = 'EARLY';
      windowMessage = `Early arrival before scheduled window (${booking.windowStartTime} – ${booking.windowEndTime})`;
    } else if (currentMinutesTotal > endMinutesTotal) {
      windowStatus = 'LATE';
      windowMessage = `Late arrival after scheduled window (${booking.windowStartTime} – ${booking.windowEndTime})`;
    }

    const farmerMobileMasked = booking.farmer.mobile
      ? booking.farmer.mobile.slice(0, 2) + '******' + booking.farmer.mobile.slice(-2)
      : undefined;

    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      farmerDisplayName: booking.farmer.fullName,
      farmerCode: booking.farmer.farmerCode,
      farmerMobileMasked,
      verificationStatus: 'VERIFIED',
      centreId: centre.id,
      centreName: centre.name,
      centreAddress: centre.address,
      bookingDate: bookingDateStr,
      session: booking.session,
      arrivalWindow: `${booking.windowStartTime} – ${booking.windowEndTime}`,
      windowStartTime: booking.windowStartTime,
      windowEndTime: booking.windowEndTime,
      currentTime: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
      windowStatus,
      windowMessage,
      expectedQuantityQuintals: booking.expectedQuantityQuintals,
      transport: booking.vehicleType || 'Standard Transport',
      vehicleNumber: booking.vehicleNumber,
      status: booking.status,
      isEligible: true,
    };
  }

  /**
   * Atomic Check-in Confirmation with Queue Generation and Realtime Event Dispatching
   */
  async confirmCheckin(userId: string, rawInput: string): Promise<CheckinConfirmResponseDto> {
    const centre = await this.getOfficerCentre(userId);
    const reference = this.normalizeReference(rawInput);

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.procurementBooking.findFirst({
        where: {
          OR: [
            { bookingNumber: reference },
            { id: reference },
          ],
        },
        include: { farmer: true, centre: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking could not be found.');
      }

      if (booking.centreId !== centre.id) {
        throw new ForbiddenException('Booking is not assigned to this procurement centre.');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot check in a cancelled booking.');
      }

      if (!booking.farmer || !booking.farmer.isVerified) {
        throw new BadRequestException('Farmer verification is not complete.');
      }

      if (
        booking.status === BookingStatus.CHECKED_IN ||
        booking.status === BookingStatus.WEIGHMENT ||
        booking.status === BookingStatus.QUALITY_ASSESSMENT ||
        booking.status === BookingStatus.PROCUREMENT ||
        booking.status === BookingStatus.PAYMENT ||
        booking.status === BookingStatus.COMPLETED
      ) {
        throw new BadRequestException('Booking has already been checked in.');
      }

      if (booking.status !== BookingStatus.BOOKED && booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(`Cannot check in booking with status: ${booking.status}`);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Count checked in today to calculate queue position
      const checkedInToday = await tx.procurementBooking.count({
        where: {
          centreId: centre.id,
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
          checkInTime: { gte: todayStart },
        },
      });

      const queuePosition = checkedInToday + 1;
      const yearShort = String(todayStart.getFullYear()).slice(-2);
      const queueToken = `ASTRA-Q-${yearShort}-${String(queuePosition).padStart(6, '0')}`;
      const checkInTime = new Date();

      const updated = await tx.procurementBooking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkInTime,
        },
        include: { farmer: true, centre: true },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'CHECK_IN_CONFIRMED',
          bookingId: updated.id,
          centreId: centre.id,
          actorId: userId,
          actorRole: 'CHECK_IN_OFFICER',
          previousState: { status: booking.status },
          newState: {
            status: BookingStatus.CHECKED_IN,
            checkInTime: checkInTime.toISOString(),
            queueToken,
            queuePosition,
          },
          reason: 'Physical arrival verified and checked in by Gate Officer',
        },
      });

      return { updated, queueToken, queuePosition, checkInTime };
    });

    // Notify Weighment Department queue in real time
    this.eventsGateway.emitToDepartment(centre.id, 'weighment', 'queue:updated', {
      bookingId: result.updated.id,
      bookingNumber: result.updated.bookingNumber,
      farmerName: result.updated.farmer.fullName,
      farmerCode: result.updated.farmer.farmerCode,
      queueToken: result.queueToken,
      queuePosition: result.queuePosition,
      expectedQuantityQuintals: result.updated.expectedQuantityQuintals,
      checkInTime: result.checkInTime.toISOString(),
    });

    // Notify Farmer
    this.eventsGateway.emitToFarmer(result.updated.farmerId, 'booking:checked_in', {
      bookingNumber: result.updated.bookingNumber,
      queueToken: result.queueToken,
      queuePosition: result.queuePosition,
      checkInTime: result.checkInTime.toISOString(),
      status: BookingStatus.CHECKED_IN,
    });

    return {
      success: true,
      message: 'Farmer check-in verified successfully. Transferred to Weighment Queue.',
      booking: {
        id: result.updated.id,
        bookingNumber: result.updated.bookingNumber,
        farmerName: result.updated.farmer.fullName,
        farmerCode: result.updated.farmer.farmerCode,
        queueToken: result.queueToken,
        queuePosition: result.queuePosition,
        nextStep: 'Weighment',
        status: result.updated.status,
        checkInTime: result.checkInTime.toISOString(),
      },
    };
  }

  /**
   * Backward compatibility alias
   */
  async performCheckin(userId: string, bookingId: string) {
    return this.confirmCheckin(userId, bookingId);
  }

  /**
   * Get scheduled arrivals for today for officer's assigned centre.
   */
  async getTodayScheduledArrivals(userId: string) {
    const centre = await this.getOfficerCentre(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bookings = await this.prisma.procurementBooking.findMany({
      where: {
        centreId: centre.id,
        bookingDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        farmer: true,
      },
      orderBy: [
        { session: 'asc' },
        { windowStartTime: 'asc' },
      ],
    });

    // Calculate queue positions for checked-in ones based on checkInTime
    const checkedInList = bookings
      .filter((b) => b.checkInTime)
      .sort((a, b) => (a.checkInTime!.getTime() - b.checkInTime!.getTime()));

    const queueMap = new Map<string, { position: number; token: string }>();
    const yearShort = String(today.getFullYear()).slice(-2);
    checkedInList.forEach((b, idx) => {
      const pos = idx + 1;
      queueMap.set(b.id, {
        position: pos,
        token: `ASTRA-Q-${yearShort}-${String(pos).padStart(6, '0')}`,
      });
    });

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        centreCode: centre.centreCode,
        address: centre.address,
      },
      scheduled: bookings.map((b) => {
        const qInfo = queueMap.get(b.id);
        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          farmerName: b.farmer.fullName,
          farmerCode: b.farmer.farmerCode,
          farmerMobile: b.farmer.mobile,
          farmerVerified: b.farmer.isVerified,
          session: b.session,
          windowStartTime: b.windowStartTime,
          windowEndTime: b.windowEndTime,
          expectedQuantityQuintals: b.expectedQuantityQuintals,
          vehicleNumber: b.vehicleNumber,
          vehicleType: b.vehicleType,
          driverName: b.driverName,
          status: b.status,
          checkInTime: b.checkInTime ? b.checkInTime.toISOString() : null,
          queuePosition: qInfo ? qInfo.position : null,
          queueToken: qInfo ? qInfo.token : null,
        };
      }),
    };
  }
}
