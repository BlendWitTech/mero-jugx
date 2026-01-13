import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from './logger.service';
import { createMockConfigService } from '../../../test/helpers/test-utils';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: ConfigService,
          useValue: createMockConfigService({
            LOG_LEVEL: 'info',
            NODE_ENV: 'test',
            LOG_DIR: './logs',
          }),
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log info message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.log('Test message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      service.error('Test error', 'stack trace', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.warn('Test warning', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      service.debug('Test debug', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.verbose('Test verbose', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

