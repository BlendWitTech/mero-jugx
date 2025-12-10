import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * CSRF Guard for JWT-based APIs
 * 
 * Note: CSRF protection is less critical for JWT-based APIs since:
 * - Tokens are stored in headers, not cookies
 * - Same-origin policy provides protection
 * - CORS is configured
 * 
 * This guard provides basic origin validation for additional security.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    // Skip CSRF check in development
    if (nodeEnv === 'development') {
      return true;
    }

    // Skip CSRF for API routes using JWT (already protected)
    if (request.path.startsWith('/api/') && request.headers.authorization) {
      return true;
    }

    // Skip for health checks
    if (request.path.startsWith('/health')) {
      return true;
    }

    // Basic origin validation
    const origin = request.headers.origin;
    const referer = request.headers.referer;
    const allowedOrigin = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

    if (origin && origin !== allowedOrigin) {
      return false;
    }

    if (referer && !referer.startsWith(allowedOrigin)) {
      return false;
    }

    return true;
  }
}

