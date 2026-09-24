import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';

@Module({
  imports: [DatabaseModule, RealtimeModule, AuthModule],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
