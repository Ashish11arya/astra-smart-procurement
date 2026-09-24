import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('PostgreSQL database connection established via Prisma.');
    } catch (error) {
      this.logger.warn(`Initial database connection attempt failed: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection disconnected.');
  }

  /**
   * Health ping to verify PostgreSQL connectivity and latency.
   */
  async ping(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    const startTime = Date.now();
    try {
      // Execute lightweight raw query to test PostgreSQL connection
      await this.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - startTime;
      return { ok: true, latencyMs };
    } catch (err) {
      const message = (err as Error).message;
      return { ok: false, error: message };
    }
  }
}
