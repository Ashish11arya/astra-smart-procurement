import { Module, forwardRef } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { FarmerController } from './farmer.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [AuthModule, DatabaseModule, IntegrationsModule, forwardRef(() => BookingModule)],
  controllers: [FarmerController],
  providers: [FarmerService],
  exports: [FarmerService],
})
export class FarmerModule {}
