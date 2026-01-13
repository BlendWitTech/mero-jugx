import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Create a mock repository for testing
 */
export function createMockRepository<T>(): Partial<Repository<T>> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
    })) as any,
  };
}

/**
 * Create a mock ConfigService with default values
 */
export function createMockConfigService(overrides: Record<string, any> = {}) {
  const defaults = {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    FRONTEND_URL: 'http://localhost:3001',
    APP_URL: 'http://localhost:3000',
    APP_NAME: 'Mero Jugx',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    ...overrides,
  };

  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      return defaults[key] !== undefined ? defaults[key] : defaultValue;
    }),
  };
}

/**
 * Create a mock JWT Service
 */
export function createMockJwtService() {
  return {
    sign: jest.fn((payload: any) => `mock-token-${JSON.stringify(payload)}`),
    verify: jest.fn((token: string) => {
      if (token.startsWith('mock-token-')) {
        return JSON.parse(token.replace('mock-token-', ''));
      }
      throw new Error('Invalid token');
    }),
    decode: jest.fn(),
  };
}

/**
 * Create a mock Redis Service
 */
export function createMockRedisService() {
  const store = new Map<string, string>();

  return {
    getClient: jest.fn().mockResolvedValue({
      get: jest.fn((key: string) => Promise.resolve(store.get(key) || null)),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      setEx: jest.fn((key: string, seconds: number, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve(1);
      }),
      exists: jest.fn((key: string) => Promise.resolve(store.has(key) ? 1 : 0)),
      keys: jest.fn((pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Promise.resolve(Array.from(store.keys()).filter(k => regex.test(k)));
      }),
    }),
  };
}

/**
 * Create a mock Email Service
 */
export function createMockEmailService() {
  return {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendInvitationEmail: jest.fn().mockResolvedValue(true),
    sendAccessRevokedEmail: jest.fn().mockResolvedValue(true),
    sendDataTransferredEmail: jest.fn().mockResolvedValue(true),
  };
}

/**
 * Create a mock DataSource
 */
export function createMockDataSource() {
  const queryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    getRepository: jest.fn(),
    manager: queryRunner.manager,
  };
}

/**
 * Wait for async operations to complete
 */
export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

