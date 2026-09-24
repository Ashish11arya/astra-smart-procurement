import { Injectable, Logger } from '@nestjs/common';
import {
  GovernmentIntegrationProvider,
  FarmerQuotaCheckQuery,
  FarmerQuotaVerificationResult,
  SettlementNotificationPayload,
  SettlementNotificationAck,
  FarmerRegistrationVerificationPayload,
  FarmerRegistrationVerificationResult,
} from './government.interface';

@Injectable()
export class GovernmentStubAdapter implements GovernmentIntegrationProvider {
  private readonly logger = new Logger(GovernmentStubAdapter.name);

  async verifyFarmerQuota(query: FarmerQuotaCheckQuery): Promise<FarmerQuotaVerificationResult> {
    this.logger.warn(
      `[DEV ADAPTER] Quota verification stub called for farmer national ID hash: ${query.farmerNationalId.slice(-4)}. No live government gateway connected.`,
    );
    return {
      verified: false,
      reason: 'UNCONFIGURED_GOVERNMENT_INTEGRATION_ADAPTER',
      sourceAuthority: 'DEV_STUB',
    };
  }

  async submitProcurementSettlement(
    payload: SettlementNotificationPayload,
  ): Promise<SettlementNotificationAck> {
    this.logger.warn(
      `[DEV ADAPTER] Settlement transmission stub called for transaction ${payload.procurementTransactionId}. No live government gateway connected.`,
    );
    return {
      acknowledged: false,
      message: 'UNCONFIGURED_GOVERNMENT_INTEGRATION_ADAPTER',
    };
  }

  /**
   * Development / Mock Adapter for Farmer Registration Verification.
   * Clearly separated from future authorised state agricultural portals.
   */
  async verifyFarmerRegistration(
    payload: FarmerRegistrationVerificationPayload,
  ): Promise<FarmerRegistrationVerificationResult> {
    this.logger.log(
      `=======================================================\n` +
      `[DEV VERIFICATION ADAPTER] Processing verification simulation\n` +
      `Registration: ${payload.registrationNumber} | Name: ${payload.fullName}\n` +
      `Location: ${payload.village}, ${payload.block}, ${payload.district}\n` +
      `NOTE: No live government gateway connected. Running development rule-engine.\n` +
      `=======================================================`,
    );

    // Rule-engine simulation for required test journeys:
    // Journey 4: If name includes "Action" or test flag, return ACTION_REQUIRED
    if (payload.fullName.toLowerCase().includes('action') || payload.bankIfsc === 'TEST0000000') {
      return {
        status: 'ACTION_REQUIRED',
        actionRequiredNotes: 'Bank account name does not match the land ownership record. Please update your bank account details.',
        verificationSource: 'DEV_VERIFICATION_ADAPTER',
      };
    }

    // If name includes "Reject", return REJECTED
    if (payload.fullName.toLowerCase().includes('reject')) {
      return {
        status: 'REJECTED',
        rejectionReason: 'Land parcel survey number could not be authenticated against the state digitised land registry.',
        verificationSource: 'DEV_VERIFICATION_ADAPTER',
      };
    }

    // Default: Return UNDER_VERIFICATION (registration submitted and queued for verification)
    return {
      status: 'UNDER_VERIFICATION',
      verificationSource: 'DEV_VERIFICATION_ADAPTER',
    };
  }
}
