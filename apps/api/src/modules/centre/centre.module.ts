import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { AuthModule } from '../auth/auth.module';
import { CentreService } from './centre.service';
import { CentreController } from './centre.controller';

@Module({
  imports: [DatabaseModule, SchedulingModule, AuthModule],
  controllers: [CentreController],
  providers: [CentreService],
  exports: [CentreService],
})
export class CentreModule {}
