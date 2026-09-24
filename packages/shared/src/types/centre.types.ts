import {
  CentreVerificationStatus,
  CentreOperationalStatus,
  CounterStatus,
  BookingSession,
  BookingStatus,
  WeighmentStatus,
  QualityGrade,
  ProcurementDecision,
  PaymentStatus,
} from '../enums/centre.enum';
import { UserRole } from '../enums/role.enum';

export interface StateDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DistrictDto {
  id: string;
  stateId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface CounterDto {
  id: string;
  centreId: string;
  counterNumber: number;
  counterName: string;
  status: CounterStatus;
}

export interface ProcurementCentreDto {
  id: string;
  centreCode: string;
  name: string;
  stateId: string;
  stateName?: string;
  districtId: string;
  districtName?: string;
  block?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  agency: string;
  operatingDays: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  morningCapacityQuintals: number;
  afternoonCapacityQuintals: number;
  maxHourlyCapacityQuintals: number;
  slotDurationMinutes: number;
  maxQuantityPerBooking: number;
  verificationStatus: CentreVerificationStatus;
  operationalStatus: CentreOperationalStatus;
  contactPhone?: string | null;
  contactEmail?: string | null;
  distanceKm?: number; // Geodesic approximate distance
  availableMorningCapacity?: number;
  availableAfternoonCapacity?: number;
  counters?: CounterDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DaySessionAvailability {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  isOperatingDay: boolean;
  morning: {
    available: boolean;
    remainingCapacityQuintals: number;
    totalCapacityQuintals: number;
  };
  afternoon: {
    available: boolean;
    remainingCapacityQuintals: number;
    totalCapacityQuintals: number;
  };
}

export interface CentreScheduleDayDto {
  date: string;
  sessions: DaySessionAvailability;
}

export interface BookingEstimateRequestDto {
  centreId: string;
  bookingDate: string; // YYYY-MM-DD within rolling 7 days
  session: BookingSession;
  expectedQuantityQuintals: number;
}

export interface BookingEstimateResponseDto {
  centreId: string;
  centreName: string;
  bookingDate: string;
  session: BookingSession;
  expectedQuantityQuintals: number;
  assignedWindowStart: string; // HH:mm
  assignedWindowEnd: string; // HH:mm
  expectedDurationMinutes: number;
  isFeasible: boolean;
  remainingSessionCapacityQuintals: number;
  sessionCapacityQuintals: number;
  notes?: string;
}

export interface CreateBookingDto {
  centreId: string;
  bookingDate: string; // YYYY-MM-DD
  session: BookingSession;
  expectedQuantityQuintals: number;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  idempotencyKey?: string;
}

export interface ProcurementBookingDto {
  id: string;
  bookingNumber: string;
  farmerId: string;
  farmerName?: string;
  farmerMobile?: string;
  farmerCode?: string;
  centreId: string;
  centreName?: string;
  centreCode?: string;
  centreAddress?: string;
  bookingDate: string;
  session: BookingSession;
  windowStartTime: string;
  windowEndTime: string;
  expectedQuantityQuintals: number;
  maxAllowedQuantityQuintals: number;
  expectedDurationMinutes: number;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  driverName?: string | null;
  status: BookingStatus;
  checkInTime?: string | null;
  cancellationReason?: string | null;
  weighment?: WeighmentRecordDto | null;
  quality?: QualityAssessmentRecordDto | null;
  procurement?: ProcurementDecisionRecordDto | null;
  payment?: PaymentSettlementRecordDto | null;
  governmentLimitAtBooking?: number | null;
  centreLimitAtBooking?: number | null;
  applicableLimitAtBooking?: number | null;
  minimumBookingAtBooking?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeighmentRecordDto {
  id: string;
  bookingId: string;
  deviceCode: string;
  originalHardwareWeight: number;
  approvedFinalWeight?: number | null;
  status: WeighmentStatus;
  correctionReason?: string | null;
  officerRemarks?: string | null;
  requestedBy?: string | null;
  requestedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HardwareSimulateReadingDto {
  bookingId: string;
  deviceCode: string;
  hardwareWeightQuintals: number;
}

export interface WeighmentCorrectionRequestDto {
  requestedFinalWeightQuintals: number;
  reason: string;
  officerRemarks: string;
}

export interface WeighmentSupervisorDecisionDto {
  decision: 'APPROVE' | 'REJECT';
  supervisorRemarks: string;
}

export interface QualityAssessmentRecordDto {
  id: string;
  bookingId: string;
  moisturePercent: number;
  foreignMatterPercent: number;
  damagedGrainPercent: number;
  grade: QualityGrade;
  remarks?: string | null;
  assessedBy: string;
  assessedAt: string;
}

export interface CreateQualityAssessmentDto {
  moisturePercent: number;
  foreignMatterPercent: number;
  damagedGrainPercent: number;
  grade: QualityGrade;
  remarks?: string;
}

export interface ProcurementDecisionRecordDto {
  id: string;
  bookingId: string;
  decision: ProcurementDecision;
  acceptedQuantityQuintals: number;
  ratePerQuintal: number;
  totalAmount: number;
  remarks?: string | null;
  decidedBy: string;
  decidedAt: string;
}

export interface CreateProcurementDecisionDto {
  decision: ProcurementDecision;
  acceptedQuantityQuintals: number;
  ratePerQuintal: number;
  remarks?: string;
}

export interface PaymentSettlementRecordDto {
  id: string;
  bookingId: string;
  paymentStatus: PaymentStatus;
  transactionRef?: string | null;
  bankAccountMasked?: string | null;
  amount: number;
  settledBy?: string | null;
  settledAt?: string | null;
}

export interface CreatePaymentSettlementDto {
  paymentStatus: PaymentStatus;
  transactionRef?: string;
  bankAccountMasked?: string;
  amount: number;
}

export interface AuditLogDto {
  id: string;
  eventType: string;
  bookingId?: string | null;
  centreId?: string | null;
  actorId: string;
  actorRole: string;
  previousState?: any;
  newState?: any;
  reason?: string | null;
  createdAt: string;
}

export interface PersonnelAssignmentDto {
  id: string;
  userId: string;
  userMobile: string;
  centreId: string;
  centreName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  assignedAt: string;
}


export interface CheckinValidateRequestDto {
  tokenOrNumber: string;
}

export interface CheckinValidateResponseDto {
  bookingId: string;
  bookingNumber: string;
  farmerDisplayName: string;
  farmerCode: string;
  farmerMobileMasked?: string;
  verificationStatus: string;
  centreId: string;
  centreName: string;
  centreAddress: string;
  bookingDate: string;
  session: string;
  arrivalWindow: string;
  windowStartTime: string;
  windowEndTime: string;
  currentTime: string;
  windowStatus: 'ON_TIME' | 'EARLY' | 'LATE';
  windowMessage: string;
  expectedQuantityQuintals: number;
  transport: string;
  vehicleNumber?: string | null;
  status: string;
  isEligible: boolean;
}

export interface CheckinConfirmRequestDto {
  bookingId: string;
  tokenOrNumber?: string;
}

export interface CheckinConfirmResponseDto {
  success: boolean;
  message: string;
  booking: {
    id: string;
    bookingNumber: string;
    farmerName: string;
    farmerCode: string;
    queueToken: string;
    queuePosition: number;
    nextStep: string;
    status: string;
    checkInTime: string;
  };
}

export interface FarmerActiveBookingDto {
  id: string;
  bookingNumber: string;
  centreId: string;
  centreName: string;
  centreCode?: string;
  centreAddress: string;
  bookingDate: string; // YYYY-MM-DD
  session: BookingSession;
  windowStartTime: string;
  windowEndTime: string;
  cropName: string;
  expectedQuantityQuintals: number;
  status: BookingStatus;
  statusLabel: string;
  checkInTime: string | null;
  queuePosition: number | null;
  farmersAhead: number | null;
  queueStatusLabel: string | null;
}

export interface FarmerDailyCapacityDto {
  date: string;
  season: string;
  crop: string;
  farmerCategory: string;
  governmentMaximumQuintals: number;
  centreDailyLimitQuintals: number;
  applicableDailyLimitQuintals: number;
  dailyBookingCapacityQuintals: number; // Backward compatibility alias
  minimumBookingQuantityQuintals: number;
  bookedTodayQuintals: number;
  remainingCapacityQuintals: number;
  centreTotalRemainingQuintals?: number;
  sessionRemainingQuintals?: number;
  canBookAnother: boolean;
  capacityMessage: string;
  centreName?: string;
  centreCode?: string;
}

export interface CentreCapacityConfigDto {
  centreId: string;
  centreName: string;
  centreCode: string;
  crop: string;
  season: string;
  effectiveDate: string;
  governmentMaximumPerFarmerQuintals: number;
  centreDailyFarmerLimitQuintals: number;
  minimumBookingQuantityQuintals: number;
  totalDailyCapacityQuintals: number;
  morningCapacityQuintals: number;
  afternoonCapacityQuintals: number;
  slotDurationMinutes: number;
  operatingDays: string;
  recentAudits?: CentreCapacityAuditDto[];
}

export interface UpdateCentreCapacityDto {
  centreDailyFarmerLimitQuintals: number;
  minimumBookingQuantityQuintals?: number;
  morningCapacityQuintals?: number;
  afternoonCapacityQuintals?: number;
  totalDailyCapacityQuintals?: number;
  reason?: string;
}

export interface CentreCapacityAuditDto {
  id: string;
  centreId: string;
  changedBy: string;
  changedAt: string;
  fieldChanged: string;
  oldValue: number;
  newValue: number;
  crop: string;
  season: string;
  effectiveDate: string;
  reason?: string;
}


export interface FarmerDashboardSummaryDto {
  farmer: {
    id: string;
    farmerCode: string;
    fullName: string;
    mobile: string;
    village?: string;
    district?: string;
    isVerified: boolean;
  };
  verificationStatus: 'VERIFIED' | 'UNDER_VERIFICATION' | 'ACTION_REQUIRED' | 'REJECTED';
  activeBookings: FarmerActiveBookingDto[];
  todayCapacity: FarmerDailyCapacityDto;
  upcomingBookings: Array<{
    id: string;
    bookingNumber: string;
    centreName: string;
    centreAddress?: string;
    bookingDate: string;
    session: BookingSession;
    windowStartTime: string;
    windowEndTime: string;
    expectedQuantityQuintals: number;
    cropName: string;
    status: BookingStatus;
    statusLabel: string;
  }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    centreName: string;
    bookingDate: string;
    expectedQuantityQuintals: number;
    acceptedQuantityQuintals?: number;
    cropName: string;
    status: BookingStatus;
    statusLabel: string;
    totalAmount?: number;
  }>;
  helpline: string;
}

export type JourneyStageStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'NOT_STARTED'
  | 'REJECTED'
  | 'FAILED'
  | 'ACTION_REQUIRED';

export interface BookingJourneyStageDto {
  stepNumber: number;
  stageId:
    | 'BOOKING_CONFIRMED'
    | 'CENTRE_CHECKIN'
    | 'PHYSICAL_QUEUE'
    | 'WEIGHMENT'
    | 'QUALITY_ASSESSMENT'
    | 'PROCUREMENT'
    | 'PAYMENT_DBT';
  title: string;
  state: JourneyStageStatus;
  timestamp?: string | null;
  department: string;
  actorRole?: string;
  summary: string;
  details?: Record<string, any>;
}

export interface FarmerBookingDetailDto {
  booking: ProcurementBookingDto;
  cropName: string;
  currentStatus: {
    code: BookingStatus;
    label: string;
    description: string;
    badgeType: 'success' | 'warning' | 'info' | 'pending' | 'danger';
  };
  queueInfo: {
    isQueued: boolean;
    queuePosition?: number | null;
    farmersAhead?: number | null;
    checkedInTime?: string | null;
    queueStatusLabel?: string;
    message?: string;
  };
  journey: BookingJourneyStageDto[];
  departmentRecords: {
    checkin: {
      status: 'COMPLETED' | 'WAITING';
      timestamp?: string | null;
      department: string;
      action: string;
      result: string;
    };
    weighment: {
      status: 'COMPLETED' | 'IN_PROGRESS' | 'WAITING';
      timestamp?: string | null;
      department: string;
      deviceCode?: string;
      grossWeightKg?: number;
      tareWeightKg?: number;
      netWeightKg?: number;
      netWeightQuintals?: number;
      statusLabel?: string;
      remarks?: string;
    };
    quality: {
      status: 'COMPLETED' | 'IN_PROGRESS' | 'WAITING' | 'REJECTED';
      timestamp?: string | null;
      department: string;
      grade?: string;
      resultLabel?: string;
      moisturePercent?: number;
      foreignMatterPercent?: number;
      damagedGrainPercent?: number;
      remarks?: string;
    };
    procurement: {
      status: 'COMPLETED' | 'IN_PROGRESS' | 'WAITING';
      timestamp?: string | null;
      department: string;
      procurementId?: string;
      decision?: string;
      bookedQuantityQuintals: number;
      weighedQuantityQuintals?: number;
      acceptedQuantityQuintals?: number;
      ratePerQuintal?: number;
      grossValue?: number;
      deductions?: number;
      netPayable?: number;
    };
    payment: {
      status: 'COMPLETED' | 'IN_PROGRESS' | 'WAITING';
      timestamp?: string | null;
      department: string;
      amount?: number;
      transactionRef?: string;
      bankAccountMasked?: string;
      statusLabel?: string;
      settledAt?: string | null;
    };
  };
  activityAuditTrail: Array<{
    timestamp: string;
    stage: string;
    department: string;
    event: string;
    description: string;
  }>;
}

