export interface FarmerQuotaCheckQuery {
  farmerNationalId: string;
  cropSeasonId: string;
  centreId: string;
}

export interface FarmerQuotaVerificationResult {
  verified: boolean;
  maxEligibleQuantityQuintals?: number;
  remainingQuotaQuintals?: number;
  reason?: string;
  sourceAuthority?: string;
}

export interface SettlementNotificationPayload {
  procurementTransactionId: string;
  farmerNationalId: string;
  totalAmount: number;
  cropDetails: {
    cropName: string;
    variety: string;
    weightQuintals: number;
    grade: string;
  };
}

export interface SettlementNotificationAck {
  acknowledged: boolean;
  externalReferenceId?: string;
  message?: string;
}

export interface FarmerRegistrationVerificationPayload {
  registrationId: string;
  registrationNumber: string;
  fullName: string;
  mobile: string;
  district: string;
  block: string;
  panchayat: string;
  village: string;
  landAreaAcres: number;
  bankIfsc: string;
  bankAccountNumber: string;
}

export interface FarmerRegistrationVerificationResult {
  status: 'VERIFIED' | 'ACTION_REQUIRED' | 'UNDER_VERIFICATION' | 'REJECTED';
  verifiedFarmerCode?: string;
  actionRequiredNotes?: string;
  rejectionReason?: string;
  verificationSource: string;
  verifiedAt?: Date;
}

/**
 * Interface contract for external government procurement portals / state agricultural APIs.
 * Concrete adapters will connect via official authorized endpoints with certified credentials.
 */
export interface GovernmentIntegrationProvider {
  verifyFarmerQuota(query: FarmerQuotaCheckQuery): Promise<FarmerQuotaVerificationResult>;
  submitProcurementSettlement(payload: SettlementNotificationPayload): Promise<SettlementNotificationAck>;
  verifyFarmerRegistration(payload: FarmerRegistrationVerificationPayload): Promise<FarmerRegistrationVerificationResult>;
}

export const GOVERNMENT_PROVIDER_TOKEN = Symbol('GOVERNMENT_PROVIDER_TOKEN');
