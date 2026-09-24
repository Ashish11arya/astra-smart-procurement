import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { WeighmentService } from './weighment.service';
import { WeighmentController } from './weighment.controller';

@Module({
  imports: [DatabaseModule, RealtimeModule, AuthModule],
  controllers: [WeighmentController],
  providers: [WeighmentService],
  exports: [WeighmentService],
})
export class WeighmentModule {}
