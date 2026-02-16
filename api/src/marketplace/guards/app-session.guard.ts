import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MfaService } from '../../mfa/mfa.service';
import { AuthService } from '../../auth/auth.service';

/**
 * Guard that enforces a recent re-auth (password or MFA) before accessing marketplace apps.
 * Uses a short-lived signed token stored client-side to avoid repeated prompts.
 */
@Injectable()
export class AppSessionGuard implements CanActivate {
  private readonly audience = 'app-session';

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mfaService: MfaService,
    private authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // JWT strategy returns userId, but some places use id - check both
      const userId = user.id || user.userId;
      if (!userId) {
        throw new UnauthorizedException('User ID not found');
      }

      // Allow presenting an app-session token to skip reauth within TTL
      const appSessionToken = this.extractToken(request);
      if (appSessionToken) {
        try {
          const payload = this.jwtService.verify(appSessionToken, {
            secret: this.configService.get<string>('JWT_SECRET'),
            audience: this.audience,
          });
          if (payload.sub === userId) {
            return true;
          }
        } catch (_) {
          // fallthrough to require reauth
        }
      }

      // Expect password or MFA code in body
      const body: any = request.body || {};
      const password = body.password as string | undefined;
      const mfaCode = body.mfa_code as string | undefined;

      if (!password && !mfaCode) {
        throw new BadRequestException('Password or MFA code is required for app access');
      }

      // If MFA enabled, prefer MFA code; else password
      // Safely access email with optional chaining
      const userEmail = user.email || user.user?.email;

      if (mfaCode) {
        await this.mfaService.verifyCode(userId, mfaCode);
      } else if (password) {
        if (!userEmail) {
          console.error('[AppSessionGuard] User email not found in request.user object', user);
          throw new BadRequestException('User email not found');
        }
        const valid = await this.authService.verifyPassword(userEmail, password);
        if (!valid) {
          throw new UnauthorizedException('Invalid password');
        }
      }

      // Issue short-lived app-session token for reuse
      const ttlMinutes = this.configService.get<number>('APP_SESSION_TTL_MINUTES', 15);
      const token = this.jwtService.sign(
        { sub: userId },
        {
          audience: this.audience,
          expiresIn: `${ttlMinutes}m`,
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      (request as any).appSessionToken = token;
      return true;
    } catch (error) {
      console.error('[AppSessionGuard] Error:', error);
      throw error;
    }
  }

  private extractToken(request: Request): string | null {
    const header = request.headers['x-app-session'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }
    return null;
  }
}

