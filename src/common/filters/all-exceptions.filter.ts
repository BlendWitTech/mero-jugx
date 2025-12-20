import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService } from '../services/sentry.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly sentryService?: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error:
        typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      details: typeof message === 'object' ? (message as any).error : null,
    };

    // Only send to Sentry for server errors (5xx) or unexpected errors
    if ((status >= 500 || !(exception instanceof HttpException)) && this.sentryService) {
      try {
        // Get user from request if available
        const user = (request as any).user;
        const organization = (request as any).organization;

        this.sentryService.captureException(exception, {
          user,
          organization,
          extra: {
            path: request.url,
            method: request.method,
            body: request.body,
            query: request.query,
            params: request.params,
          },
        });
      } catch (sentryError) {
        // Don't fail if Sentry fails
        console.error('Failed to send error to Sentry:', sentryError);
      }
    }

    // List of paths that are expected to return 404 (not implemented yet)
    const expected404Paths = [
      '/api/v1/announcements/active',
    ];

    // Skip logging for expected 404 errors
    const isExpected404 = status === 404 && expected404Paths.some(path => request.url.includes(path));

    // Log error details for debugging (skip expected 404s)
    if (!isExpected404) {
      console.error('\n❌ ========== EXCEPTION CAUGHT ==========');
      console.error(`📍 Path: ${request.method} ${request.url}`);
      console.error(`📊 Status: ${status}`);
      console.error(`💬 Message: ${typeof message === 'string' ? message : (message as any).message || 'Unknown error'}`);
      console.error(`🔴 Error: ${exception instanceof Error ? exception.message : 'Unknown error'}`);
      if (exception instanceof Error && exception.stack) {
        console.error(`📚 Stack Trace:\n${exception.stack}`);
      }
      if (request.body && Object.keys(request.body).length > 0) {
        console.error(`📦 Request Body:`, JSON.stringify(request.body, null, 2));
      }
      console.error('==========================================\n');
    }

    response.status(status).json(errorResponse);
  }
}
