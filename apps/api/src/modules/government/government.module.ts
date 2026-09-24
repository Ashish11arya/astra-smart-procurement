import { Module, Global } from '@nestjs/common';
import { GovernmentConfigService } from './government-config.service';

/**
 * Government Module
 * Provides official procurement policy configuration, quota standards, and state integration adapters.
 */
@Global()
@Module({
  providers: [GovernmentConfigService],
  exports: [GovernmentConfigService],
})
export class GovernmentModule {}
