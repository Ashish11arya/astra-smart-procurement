import { Injectable, Logger } from '@nestjs/common';

export interface ExternalRegistryQuery {
  registrationId: string;
  registrationNumber: string;
  fullName: string;
  mobile: string;
  district: string;
  block?: string;
  panchayat?: string;
  village?: string;
  landAreaAcres?: number;
  bankIfsc?: string;
  bankAccountNumber?: string;
}

export interface ExternalRegistryResult {
  isMock: boolean;
  adapterName: string;
  status: 'PENDING_AUTHORITY_REVIEW' | 'FLAGGED_INCONSISTENCY';
  advisoryNotes?: string;
  registryTimestamp: Date;
}

/**
 * Clean architectural contract for external government registries (e.g. Agristack, e-Samridhi, State Revenue Portals).
 * Future authorized government integrations plug in here without modifying domain code.
 */
export interface FarmerVerificationProvider {
  checkRegistry(query: ExternalRegistryQuery): Promise<ExternalRegistryResult>;
}

export const FARMER_VERIFICATION_PROVIDER_TOKEN = Symbol('FARMER_VERIFICATION_PROVIDER_TOKEN');

@Injectable()
export class MockFarmerVerificationProvider implements FarmerVerificationProvider {
  private readonly logger = new Logger(MockFarmerVerificationProvider.name);

  async checkRegistry(query: ExternalRegistryQuery): Promise<ExternalRegistryResult> {
    this.logger.log(
      `[MOCK REGISTRY ADVISORY] Simulating non-blocking registry pre-check for ${query.registrationNumber} (${query.fullName})`,
    );

    // Development mock: provides advisory metadata for Authority review without auto-verifying
    return {
      isMock: true,
      adapterName: 'MockStateAgricultureRegistryAdapter',
      status: 'PENDING_AUTHORITY_REVIEW',
      advisoryNotes: 'Mock agricultural registry pre-flight check completed. Awaiting authorised officer approval.',
      registryTimestamp: new Date(),
    };
  }
}
