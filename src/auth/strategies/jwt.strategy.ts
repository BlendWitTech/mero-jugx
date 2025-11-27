import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../../database/entities/organization-member.entity';

export interface JwtPayload {
  sub: string; // user id (impersonated user if impersonating)
  email: string;
  organization_id: string;
  role_id: number;
  impersonated_by?: string; // original user id if impersonating
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload, request?: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, status: UserStatus.ACTIVE },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Email verification check - MANDATORY (no development bypass)
    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Email address must be verified before accessing protected routes. Please check your inbox for the verification email.',
      );
    }

    // Verify user is still a member of the organization
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: payload.sub,
        organization_id: payload.organization_id,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'organization'],
    });

    if (!membership) {
      throw new UnauthorizedException('Organization membership not found');
    }

    // Organization email verification check - MANDATORY
    if (!membership.organization.email_verified) {
      throw new UnauthorizedException(
        'Organization email address must be verified before accessing this organization. Please check the organization email inbox for the verification email.',
      );
    }

    // Check if organization has MFA enabled and user hasn't set it up
    // Skip this check for MFA setup endpoints to avoid redirect loop
    const skipMfaCheck = request?._skipMfaCheck || false;
    if (!skipMfaCheck && membership.organization.mfa_enabled) {
      if (!user.mfa_enabled || !user.mfa_setup_completed_at) {
        // Throw a special exception that can be caught by the frontend
        const error: any = new UnauthorizedException({
          message: 'MFA setup required',
          code: 'MFA_SETUP_REQUIRED',
          requires_mfa_setup: true,
        });
        throw error;
      }
    }

    return {
      userId: user.id,
      email: user.email,
      organizationId: payload.organization_id,
      roleId: payload.role_id,
      impersonatedBy: payload.impersonated_by,
      user,
      membership,
    };
  }
}
