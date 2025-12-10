import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { createMockRedisService, createMockConfigService } from '../../../test/helpers/test-utils';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: RedisService;
  let configService: ConfigService;
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
    };

    const mockRedis = createMockRedisService();
    mockRedis.getClient = jest.fn().mockResolvedValue(mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService({ CACHE_TTL: '3600' }),
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const cachedValue = { data: 'test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const result = await service.get('test-key');

      expect(result).toEqual(cachedValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const value = { data: 'test' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.set('test-key', value);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(value),
      );
    });

    it('should set value in cache with custom TTL', async () => {
      const value = { data: 'test' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.set('test-key', value, 1800);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        1800,
        JSON.stringify(value),
      );
    });

    it('should return false on error', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await service.set('test-key', { data: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false on error', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.delete('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when available', async () => {
      const cachedValue = { data: 'cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const fetchFn = jest.fn();

      const result = await service.getOrSet('test-key', fetchFn);

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache value when not in cache', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const fetchedValue = { data: 'fetched' };
      const fetchFn = jest.fn().mockResolvedValue(fetchedValue);

      const result = await service.getOrSet('test-key', fetchFn);

      expect(result).toEqual(fetchedValue);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });
  });

  describe('invalidateOrganization', () => {
    it('should delete all keys matching organization pattern', async () => {
      const keys = ['org:org-id:users', 'org:org-id:roles'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      await service.invalidateOrganization('org-id');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('org:org-id:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
    });
  });
});

