import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: any = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      details: typeof exceptionResponse === 'object' ? (exceptionResponse as any).error : null,
    };

    // Preserve custom error codes and flags (like MFA_SETUP_REQUIRED)
    if (typeof exceptionResponse === 'object' && exceptionResponse) {
      if ((exceptionResponse as any).code) {
        errorResponse.code = (exceptionResponse as any).code;
      }
      if ((exceptionResponse as any).requires_mfa_setup !== undefined) {
        errorResponse.requires_mfa_setup = (exceptionResponse as any).requires_mfa_setup;
      }
      // Preserve any other custom fields
      Object.keys(exceptionResponse).forEach((key) => {
        if (!['message', 'error'].includes(key) && !errorResponse[key]) {
          errorResponse[key] = (exceptionResponse as any)[key];
        }
      });
    }

    response.status(status).json(errorResponse);
  }
}
