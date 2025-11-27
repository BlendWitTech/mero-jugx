import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
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

    // Log error details for debugging - make it very visible
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

    response.status(status).json(errorResponse);
  }
}
