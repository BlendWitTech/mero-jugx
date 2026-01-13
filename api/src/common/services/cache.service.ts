import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTtl = this.configService.get<number>('CACHE_TTL', 3600); // 1 hour default
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const expiration = ttl || this.defaultTtl;
      await this.redisService.set(key, serialized, expiration);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redisService.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        await this.redisService.delMultiple(keys);
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Failed to delete cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.redisService.exists(key);
    } catch (error) {
      this.logger.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set value with caching
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache for organization
   */
  async invalidateOrganization(organizationId: string): Promise<void> {
    await this.deletePattern(`org:${organizationId}:*`);
    await this.deletePattern(`user:*:org:${organizationId}:*`);
  }

  /**
   * Invalidate cache for user
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  }

  /**
   * Invalidate cache for role
   */
  async invalidateRole(roleId: string): Promise<void> {
    await this.deletePattern(`role:${roleId}:*`);
  }
}

