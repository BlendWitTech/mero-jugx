import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class MfaSetupGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest();

      // IMPORTANT: Check for temp token FIRST, before any JWT validation
      // This prevents the JWT strategy from running and checking MFA setup status

      // Check for temporary setup token in header (case-insensitive), body, or query
      // Express normalizes headers to lowercase, but check multiple variations to be safe
      const headerToken =
        request.headers['x-mfa-setup-token'] ||
        request.headers['X-MFA-Setup-Token'] ||
        request.headers['X-Mfa-Setup-Token'] ||
        (() => {
          // Case-insensitive lookup - check all header keys
          const headerKeys = Object.keys(request.headers);
          const mfaHeaderKey = headerKeys.find((k) => k.toLowerCase() === 'x-mfa-setup-token');
          if (mfaHeaderKey) {
            return request.headers[mfaHeaderKey];
          }
          // Also check if any header key contains 'mfa' and 'setup' and 'token'
          const alternativeKey = headerKeys.find(
            (k) =>
              k.toLowerCase().includes('mfa') &&
              k.toLowerCase().includes('setup') &&
              k.toLowerCase().includes('token'),
          );
          return alternativeKey ? request.headers[alternativeKey] : undefined;
        })();

      const tempSetupToken =
        headerToken || request.body?.temp_setup_token || request.query?.temp_setup_token;

      if (tempSetupToken) {
        // When a temp token is provided, skip JWT validation entirely
        // Check for login token first (from auth.service.ts)
        let tokenDataStr = await this.redisService.get(`mfa:setup:temp:${tempSetupToken}`);
        let tokenKey = `mfa:setup:temp:${tempSetupToken}`;

        // If not found, check for setup token (from mfa.service.ts initializeSetup)
        if (!tokenDataStr) {
          tokenDataStr = await this.redisService.get(`mfa:setup:${tempSetupToken}`);
          tokenKey = `mfa:setup:${tempSetupToken}`;
        }

        if (!tokenDataStr) {
          // Don't fall back to JWT - throw error immediately
          throw new UnauthorizedException({
            message: 'Invalid or expired MFA setup token. Please login again to get a new token.',
            code: 'MFA_SETUP_TOKEN_INVALID',
          });
        }

        const tokenData = JSON.parse(tokenDataStr);

        // Check if token expired
        const now = Date.now();
        if (now > tokenData.expires_at) {
          await this.redisService.del(tokenKey);
          const expiredBy = Math.round((now - tokenData.expires_at) / 1000 / 60); // minutes
          throw new UnauthorizedException(
            `MFA setup token expired ${expiredBy} minute(s) ago. Please login again to get a new token.`,
          );
        }

        // Attach user info to request for use in controllers
        // Handle both 'email' (from login) and 'user_email' (from initializeSetup)
        const userEmail = tokenData.email || tokenData.user_email;
        request.user = {
          userId: tokenData.user_id,
          email: userEmail,
          organizationId: tokenData.organization_id,
          roleId: tokenData.role_id,
          tempSetupToken: true, // Flag to indicate this is a temp token
          __request: request, // Store request reference for later access
        };

        // Store token in request for later use
        request.tempSetupToken = tempSetupToken;

        return true;
      }

      // Fallback to JWT authentication
      try {
        const result = super.canActivate(context);

        // Handle Observable, Promise, or boolean return types
        if (result instanceof Observable) {
          return new Promise<boolean>((resolve, reject) => {
            result.subscribe({
              next: (value) => resolve(value),
              error: (err) => reject(err),
            });
          });
        } else if (result instanceof Promise) {
          return result;
        } else {
          return Promise.resolve(result as boolean);
        }
      } catch (error) {
        // If JWT auth fails and no temp token, throw the error
        throw new UnauthorizedException('Authentication required. Please provide a valid token.');
      }
    } catch (error: any) {
      // Catch any errors in the guard itself
      throw error;
    }
  }
}
