import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';

@Module({
  imports: [DatabaseModule, RealtimeModule, AuthModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
