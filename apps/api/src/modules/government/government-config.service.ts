import { Injectable } from '@nestjs/common';

export interface GovernmentProcurementPolicy {
  season: string;
  crop: string;
  farmerCategory: string;
  governmentMaximumPerFarmerQuintals: number; // Level 1 Government Policy Ceiling
  defaultCentreDailyFarmerLimit: number;      // Level 2 Default Centre Daily Limit
  dailyBookingCapacityQuintals: number;       // Backward compatibility alias
  minimumBookingQuantityQuintals: number;
  defaultEligibleQuotaQuintals: number;
  helplineNumber: string;
  helplineHours: string;
  mspRatePerQuintal: number;
}

@Injectable()
export class GovernmentConfigService {
  /**
   * Returns current government-defined procurement eligibility and booking parameters.
   * Values are loaded dynamically from configuration/environment to support state/seasonal variations
   * (such as Bihar e-Sahkari or HP APPP token quotas) rather than hardcoded client-side limits.
   */
  getPolicy(cropName?: string): GovernmentProcurementPolicy {
    const govMax = process.env.GOVERNMENT_MAX_PER_FARMER_QTL
      ? parseFloat(process.env.GOVERNMENT_MAX_PER_FARMER_QTL)
      : 250.0;

    const defaultCentreCap = process.env.GOVERNMENT_DAILY_BOOKING_CAPACITY_QTL
      ? parseFloat(process.env.GOVERNMENT_DAILY_BOOKING_CAPACITY_QTL)
      : 50.0;

    const minQty = process.env.GOVERNMENT_MIN_BOOKING_QUANTITY_QTL
      ? parseFloat(process.env.GOVERNMENT_MIN_BOOKING_QUANTITY_QTL)
      : 10.0;

    return {
      season: process.env.GOVERNMENT_ACTIVE_SEASON || 'Kharif 2026',
      crop: cropName || process.env.GOVERNMENT_DEFAULT_CROP || 'Paddy',
      farmerCategory: 'Rayit',
      governmentMaximumPerFarmerQuintals: isNaN(govMax) ? 250.0 : govMax,
      defaultCentreDailyFarmerLimit: isNaN(defaultCentreCap) ? 50.0 : defaultCentreCap,
      dailyBookingCapacityQuintals: isNaN(defaultCentreCap) ? 50.0 : defaultCentreCap,
      minimumBookingQuantityQuintals: isNaN(minQty) ? 10.0 : minQty,
      defaultEligibleQuotaQuintals: 500.0,
      helplineNumber: process.env.KISAN_HELPLINE_NUMBER || '1800-180-1551',
      helplineHours: '8:00 AM – 8:00 PM (All Days)',
      mspRatePerQuintal: 2325.0,
    };
  }
}
