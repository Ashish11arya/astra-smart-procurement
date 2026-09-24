import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PredictionService } from './prediction.service';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [DatabaseModule],
  providers: [PredictionService, SchedulingService],
  exports: [PredictionService, SchedulingService],
})
export class SchedulingModule {}
