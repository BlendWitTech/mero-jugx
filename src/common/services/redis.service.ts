import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = createClient({
        socket: {
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
        },
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
        console.warn('⚠️ Redis disconnected');
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('⚠️ Failed to connect to Redis:', error?.message || error);
      console.warn('⚠️ Redis operations will be skipped. Some features may not work correctly.');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }
  }

  private async ensureConnected(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      // Check if client is still connected
      await this.client.ping();
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!(await this.ensureConnected())) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!(await this.ensureConnected())) {
      return;
    }
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!(await this.ensureConnected())) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!(await this.ensureConnected())) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Token blacklisting
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expiresIn);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.exists(`blacklist:${token}`);
  }
}
