import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GovernmentConfigService } from '../government/government-config.service';
import {
  FarmerDailyCapacityDto,
  BookingStatus,
  BookingSession,
  CentreVerificationStatus,
  CentreOperationalStatus,
} from '@astra/shared';
import {
  formatIstDateStr,
  getTodayIstDateStr,
  parseIstDateRange,
} from '../../common/utils/date.util';

@Injectable()
export class CapacityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly govConfig: GovernmentConfigService,
  ) {}

  /**
   * Authoritative single-source capacity calculation respecting the 4-level hierarchy:
   * Level 1: Government Eligibility / Policy Limit (e.g. 250 qtl)
   * Level 2: Centre Head Operational Daily Limit (e.g. 50 qtl/day at this centre)
   * Level 3: Farmer Remaining Daily Capacity (min(Level 1 remaining, Level 2 remaining))
   * Level 4: Centre Physical & Session Capacity
   */
  async getFarmerBookingCapacity(
    farmerId: string,
    centreId?: string | null,
    dateStr?: string | null,
    cropName?: string,
  ): Promise<FarmerDailyCapacityDto> {
    const targetDateStr = dateStr ? dateStr.trim() : getTodayIstDateStr();
    const { startOfDay, endOfDay, canonicalDateStr } = parseIstDateRange(targetDateStr);
    const policy = this.govConfig.getPolicy(cropName);

    // 1. Resolve procurement centre configuration
    let centre: any = null;
    if (centreId) {
      centre = await this.prisma.procurementCentre.findUnique({
        where: { id: centreId },
      });
    }

    // If no centreId passed, inspect if farmer has an active booking today to anchor centre
    if (!centre) {
      const activeBooking = await this.prisma.procurementBooking.findFirst({
        where: {
          farmerId,
          bookingDate: { gte: startOfDay, lt: endOfDay },
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        },
        include: { centre: true },
        orderBy: { createdAt: 'desc' },
      });
      if (activeBooking?.centre) {
        centre = activeBooking.centre;
      }
    }

    // Level 1: Government Policy Maximum (Ceiling)
    const governmentMaximumQuintals = policy.governmentMaximumPerFarmerQuintals;
    const minimumBookingQuantityQuintals = centre?.minBookingQuantityQuintals || policy.minimumBookingQuantityQuintals;

    // Level 2: Centre Head Operational Daily Limit (guaranteed <= Government Maximum)
    const rawCentreDailyLimit = centre?.centreDailyFarmerLimit || policy.defaultCentreDailyFarmerLimit;
    const centreDailyLimitQuintals = Math.min(rawCentreDailyLimit, governmentMaximumQuintals);

    // Level 3: Applicable Daily Limit for this context
    const applicableDailyLimitQuintals = Math.min(governmentMaximumQuintals, centreDailyLimitQuintals);

    // Fetch farmer's non-cancelled bookings for the canonical date
    const dayBookings = await this.prisma.procurementBooking.findMany({
      where: {
        farmerId,
        bookingDate: { gte: startOfDay, lt: endOfDay },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      },
    });

    // Sum booked for this date at the specific centre (if centre is known)
    const bookedAtThisCentreToday = centre
      ? dayBookings
          .filter((b) => b.centreId === centre.id)
          .reduce((sum, b) => sum + b.expectedQuantityQuintals, 0)
      : dayBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);

    const totalBookedTodayAllCentres = dayBookings.reduce(
      (sum, b) => sum + b.expectedQuantityQuintals,
      0,
    );

    // Level 3 calculation:
    // Level 1: Government daily ceiling remaining (250 qtl/day minus all bookings by this farmer today across all centres)
    const remainingUnderGovtDaily = Math.max(0, governmentMaximumQuintals - totalBookedTodayAllCentres);
    // Level 2: Centre daily limit remaining (e.g. 50 qtl/day at this centre minus bookings at this centre today)
    const remainingAtCentre = Math.max(0, centreDailyLimitQuintals - bookedAtThisCentreToday);
    // Level 3 remaining: min(Level 1 govt remaining, Level 2 centre remaining)
    let remainingCapacityQuintals = Math.min(remainingAtCentre, remainingUnderGovtDaily);

    // If seasonal overall quota applies, cap by season remaining
    if (policy.defaultEligibleQuotaQuintals) {
      const seasonBookings = await this.prisma.procurementBooking.findMany({
        where: {
          farmerId,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        },
        select: { expectedQuantityQuintals: true },
      });
      const totalSeasonBooked = seasonBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);
      const remainingSeason = Math.max(0, policy.defaultEligibleQuotaQuintals - totalSeasonBooked);
      remainingCapacityQuintals = Math.min(remainingCapacityQuintals, remainingSeason);
    }

    const canBookAnother = remainingCapacityQuintals >= minimumBookingQuantityQuintals;

    // Level 4: Check physical centre availability if centre exists
    let centreTotalRemainingQuintals: number | undefined;
    let sessionRemainingQuintals: number | undefined;

    if (centre) {
      const allCentreDayBookings = await this.prisma.procurementBooking.findMany({
        where: {
          centreId: centre.id,
          bookingDate: { gte: startOfDay, lt: endOfDay },
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        },
        select: { expectedQuantityQuintals: true, session: true },
      });

      const totalCentreBooked = allCentreDayBookings.reduce((sum, b) => sum + b.expectedQuantityQuintals, 0);
      const totalCapacity = centre.morningCapacityQuintals + centre.afternoonCapacityQuintals;
      centreTotalRemainingQuintals = Math.max(0, totalCapacity - totalCentreBooked);
    }

    // Informative government/centre capacity message
    let capacityMessage = '';
    if (canBookAnother) {
      capacityMessage = `You can book up to ${remainingCapacityQuintals.toFixed(1)} q at this centre for ${canonicalDateStr} (minimum booking: ${minimumBookingQuantityQuintals} q).`;
    } else if (remainingCapacityQuintals > 0 && remainingCapacityQuintals < minimumBookingQuantityQuintals) {
      capacityMessage = `Only ${remainingCapacityQuintals.toFixed(1)} q capacity remains for this date, which is below the minimum booking quantity of ${minimumBookingQuantityQuintals} q.`;
    } else if (bookedAtThisCentreToday >= centreDailyLimitQuintals) {
      capacityMessage = `Your daily booking limit (${centreDailyLimitQuintals} q) at this procurement centre has been fully reached for today.`;
    } else if (totalBookedTodayAllCentres >= governmentMaximumQuintals) {
      capacityMessage = `The statutory government daily procurement limit (${governmentMaximumQuintals} q) has been fully reached for this date.`;
    } else {
      capacityMessage = `Daily booking capacity limit (${applicableDailyLimitQuintals} q) has been reached for this date.`;
    }

    return {
      date: canonicalDateStr,
      season: policy.season,
      crop: policy.crop,
      farmerCategory: policy.farmerCategory,
      governmentMaximumQuintals,
      centreDailyLimitQuintals,
      applicableDailyLimitQuintals,
      dailyBookingCapacityQuintals: applicableDailyLimitQuintals, // Alias for backward compatibility
      minimumBookingQuantityQuintals,
      bookedTodayQuintals: bookedAtThisCentreToday,
      remainingCapacityQuintals,
      centreTotalRemainingQuintals,
      sessionRemainingQuintals,
      canBookAnother,
      capacityMessage,
      centreName: centre?.name,
      centreCode: centre?.centreCode,
    };
  }
}
