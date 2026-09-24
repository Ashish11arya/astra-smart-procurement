import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Core infrastructural modules
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { HealthModule } from './health/health.module';

// Modular domain skeletons (business logic to follow in subsequent phases)
import { AuthModule } from './modules/auth/auth.module';
import { FarmerModule } from './modules/farmer/farmer.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { CentreModule } from './modules/centre/centre.module';
import { BookingModule } from './modules/booking/booking.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { QueueModule } from './modules/queue/queue.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { WeighmentModule } from './modules/weighment/weighment.module';
import { QualityModule } from './modules/quality/quality.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { GovernmentModule } from './modules/government/government.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Global environment config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Infrastructure & Integration modules
    DatabaseModule,
    RedisModule,
    RealtimeModule,
    IntegrationsModule,
    HealthModule,

    // Core domain modules
    AuthModule,
    FarmerModule,
    RegistrationModule,
    CentreModule,
    BookingModule,
    SchedulingModule,
    QueueModule,
    CheckinModule,
    WeighmentModule,
    QualityModule,
    ProcurementModule,
    PaymentModule,
    NotificationModule,
    GovernmentModule,
    AdminModule,
  ],
})
export class AppModule {}
