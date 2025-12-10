import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const tracesSampleRate = this.configService.get<number>('SENTRY_TRACES_SAMPLE_RATE', 1.0);
    const profilesSampleRate = this.configService.get<number>('SENTRY_PROFILES_SAMPLE_RATE', 1.0);

    if (!dsn) {
      this.logger.warn('Sentry DSN not configured. Error tracking disabled.');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        integrations: [
          nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? tracesSampleRate : 1.0,
        // Profiling
        profilesSampleRate: environment === 'production' ? profilesSampleRate : 1.0,
        // Release tracking
        release: process.env.npm_package_version || '1.0.0',
        // Filter out sensitive data
        beforeSend: (event, hint) => {
          // Remove sensitive data from request body
          if (event.request?.data) {
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
            event.request.data = this.sanitizeObject(event.request.data, sensitiveFields);
          }
          return event;
        },
        // Filter out certain errors
        ignoreErrors: [
          'ValidationError',
          'UnauthorizedException',
          'ForbiddenException',
          'NotFoundException',
        ],
      });

      this.logger.log('Sentry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', error);
    }
  }

  private sanitizeObject(obj: any, sensitiveFields: string[]): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, sensitiveFields));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, sensitiveFields);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  captureException(exception: any, context?: any) {
    if (context) {
      Sentry.withScope((scope) => {
        if (context.user) {
          scope.setUser({
            id: context.user.id,
            email: context.user.email,
            username: context.user.email,
          });
        }
        if (context.organization) {
          scope.setTag('organization_id', context.organization.id);
        }
        if (context.extra) {
          scope.setExtras(context.extra);
        }
        Sentry.captureException(exception);
      });
    } else {
      Sentry.captureException(exception);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any) {
    if (context) {
      Sentry.withScope((scope) => {
        if (context.user) {
          scope.setUser({
            id: context.user.id,
            email: context.user.email,
            username: context.user.email,
          });
        }
        if (context.organization) {
          scope.setTag('organization_id', context.organization.id);
        }
        if (context.extra) {
          scope.setExtras(context.extra);
        }
        scope.setLevel(level);
        Sentry.captureMessage(message);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  setUser(user: { id: string; email: string; username?: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    });
  }

  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
  }
}

