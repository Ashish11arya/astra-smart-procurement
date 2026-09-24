import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckResponse, ServiceStatus } from '@astra/shared';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventsGateway } from '../realtime/events.gateway';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly realtime: EventsGateway,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getHealth(): Promise<HealthCheckResponse> {
    const dbPing = await this.prisma.ping();
    const redisPing = await this.redis.ping();
    const isRealtimeReady = this.realtime.isReady();

    const dbStatus: ServiceStatus = dbPing.ok ? 'up' : 'down';
    const redisStatus: ServiceStatus = redisPing.ok
      ? 'up'
      : process.env.REDIS_URL
        ? 'down'
        : 'unconfigured';
    const wsStatus: ServiceStatus = isRealtimeReady ? 'up' : 'down';

    const isSystemOk = dbPing.ok;
    const status = isSystemOk ? (redisPing.ok ? 'ok' : 'degraded') : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: '0.1.0',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbPing.latencyMs,
          message: dbPing.ok ? 'PostgreSQL connection active via Prisma' : dbPing.error,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisPing.latencyMs,
          message: redisPing.ok
            ? 'Redis active'
            : redisStatus === 'unconfigured'
              ? 'Redis not configured (optional in dev setup)'
              : redisPing.error,
        },
        websocket: {
          status: wsStatus,
          message: isRealtimeReady ? 'Socket.IO Real-time gateway active' : 'Gateway inactive',
        },
      },
    };
  }
}
