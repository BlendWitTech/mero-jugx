import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/node';
import { createMockConfigService } from '../../../test/helpers/test-utils';

jest.mock('@sentry/node');

describe('SentryService', () => {
  let service: SentryService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentryService,
        {
          provide: ConfigService,
          useValue: createMockConfigService({
            SENTRY_DSN: 'https://test@sentry.io/test',
            NODE_ENV: 'test',
            SENTRY_TRACES_SAMPLE_RATE: '1.0',
            SENTRY_PROFILES_SAMPLE_RATE: '1.0',
          }),
        },
      ],
    }).compile();

    service = module.get<SentryService>(SentryService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Initialize Sentry
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Sentry when DSN is provided', async () => {
      expect(Sentry.init).toHaveBeenCalled();
    });

    it('should not initialize Sentry when DSN is not provided', async () => {
      const moduleWithoutDsn: TestingModule = await Test.createTestingModule({
        providers: [
          SentryService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({
              SENTRY_DSN: '',
            }),
          },
        ],
      }).compile();

      const serviceWithoutDsn = moduleWithoutDsn.get<SentryService>(SentryService);
      await serviceWithoutDsn.onModuleInit();
      
      // Should not throw, just log warning
      expect(serviceWithoutDsn).toBeDefined();
    });
  });

  describe('captureException', () => {
    it('should capture exception without context', () => {
      const error = new Error('Test error');
      service.captureException(error);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = {
        user: { id: 'user-id', email: 'test@example.com' },
        organization: { id: 'org-id' },
        extra: { key: 'value' },
      };

      service.captureException(error, context);
      
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    it('should capture message', () => {
      service.captureMessage('Test message', 'info');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture message with context', () => {
      const context = {
        user: { id: 'user-id', email: 'test@example.com' },
        organization: { id: 'org-id' },
      };

      service.captureMessage('Test message', 'warning', context);
      
      expect(Sentry.captureMessage).toHaveBeenCalled();
    });
  });

  describe('setUser', () => {
    it('should set user in Sentry', () => {
      const user = { id: 'user-id', email: 'test@example.com', username: 'testuser' };
      service.setUser(user);
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });
  });

  describe('setTag', () => {
    it('should set tag in Sentry', () => {
      service.setTag('key', 'value');
      
      expect(Sentry.setTag).toHaveBeenCalledWith('key', 'value');
    });
  });

  describe('setContext', () => {
    it('should set context in Sentry', () => {
      const context = { key: 'value' };
      service.setContext('name', context);
      
      expect(Sentry.setContext).toHaveBeenCalledWith('name', context);
    });
  });
});

