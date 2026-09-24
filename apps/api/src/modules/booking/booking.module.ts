import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { BookingService } from './booking.service';
import { CapacityService } from './capacity.service';
import { BookingController } from './booking.controller';

@Module({
  imports: [DatabaseModule, SchedulingModule, RealtimeModule, AuthModule],
  controllers: [BookingController],
  providers: [BookingService, CapacityService],
  exports: [BookingService, CapacityService],
})
export class BookingModule {}
