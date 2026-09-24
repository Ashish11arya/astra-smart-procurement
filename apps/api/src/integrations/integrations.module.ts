import { Global, Module } from '@nestjs/common';
import { NOTIFICATION_PROVIDER_TOKEN } from './notification/notification.interface';
import { NotificationStubAdapter } from './notification/notification-stub.adapter';
import { GOVERNMENT_PROVIDER_TOKEN } from './government/government.interface';
import { GovernmentStubAdapter } from './government/government-stub.adapter';
import {
  FARMER_VERIFICATION_PROVIDER_TOKEN,
  MockFarmerVerificationProvider,
} from './verification/farmer-verification.provider';

@Global()
@Module({
  providers: [
    {
      provide: NOTIFICATION_PROVIDER_TOKEN,
      useClass: NotificationStubAdapter,
    },
    {
      provide: GOVERNMENT_PROVIDER_TOKEN,
      useClass: GovernmentStubAdapter,
    },
    {
      provide: FARMER_VERIFICATION_PROVIDER_TOKEN,
      useClass: MockFarmerVerificationProvider,
    },
  ],
  exports: [
    NOTIFICATION_PROVIDER_TOKEN,
    GOVERNMENT_PROVIDER_TOKEN,
    FARMER_VERIFICATION_PROVIDER_TOKEN,
  ],
})
export class IntegrationsModule {}
