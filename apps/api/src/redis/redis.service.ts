import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private redisUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.configService.get<string>('REDIS_URL') || process.env.REDIS_URL;
  }

  onModuleInit() {
    if (!this.redisUrl) {
      this.logger.warn('REDIS_URL is not configured. Redis service is in idle/unconfigured state.');
      return;
    }

    try {
      this.client = new Redis(this.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts
          }
          return Math.min(times * 200, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis server.');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection event error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      // Attempt non-blocking initial connect
      this.client.connect().catch((err) => {
        this.logger.warn(`Initial Redis connection could not be established: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize Redis client: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis client disconnected.');
      } catch (err) {
        this.logger.warn(`Error during Redis disconnection: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Foundation check for Redis health.
   */
  async ping(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    if (!this.client || !this.isConnected) {
      return {
        ok: false,
        error: this.redisUrl ? 'Redis instance unreachable' : 'REDIS_URL not configured',
      };
    }

    const start = Date.now();
    try {
      const response = await this.client.ping();
      const latencyMs = Date.now() - start;
      return { ok: response === 'PONG', latencyMs };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
