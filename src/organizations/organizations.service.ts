import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Organization } from '../database/entities/organization.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { User } from '../database/entities/user.entity';
import { Package } from '../database/entities/package.entity';
import { Role } from '../database/entities/role.entity';
import { Invitation } from '../database/entities/invitation.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { EmailService } from '../common/services/email.service';
import { RedisService } from '../common/services/redis.service';
import { Notification } from '../database/entities/notification.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private emailService: EmailService,
    private redisService: RedisService,
    private auditLogsService: AuditLogsService,
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getCurrentOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Organization & { current_user_role?: any }> {
    try {
      // Verify user is member of organization
      const membership = await this.memberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['organization', 'organization.package', 'role'],
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      if (!membership.organization) {
        console.error('Membership found but organization is null:', { userId, organizationId, membershipId: membership.id });
        throw new NotFoundException('Organization not found');
      }

      // Return organization with current user's role information
      return {
        ...membership.organization,
        current_user_role: membership.role,
      };
    } catch (error: any) {
      console.error('Error in getCurrentOrganization:', {
        userId,
        organizationId,
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await this.memberRepository.find({
      where: {
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['organization', 'organization.package', 'role'],
      order: {
        joined_at: 'DESC',
      },
    });

    return memberships.map((membership) => membership.organization);
  }

  async updateOrganization(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    // Verify user has permission (organization owner or admin with settings.manage)
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check if user is organization owner
    if (membership.role.is_organization_owner) {
      // Organization owner has all permissions
    } else {
      // Check if role has settings.manage permission
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'settings.manage',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to update organization settings');
      }
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if name or email is being changed and if it's unique
    if (dto.name && dto.name !== organization.name) {
      const existing = await this.organizationRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Organization name already exists');
      }
      // Update slug when name changes (only for non-Freemium packages)
      const packageSlug = organization.package?.slug;
      if (packageSlug && packageSlug !== 'freemium') {
        organization.slug = this.generateSlug(dto.name);
      }
      // For Freemium, slug remains unchanged (set during registration)
    }

    if (dto.email && dto.email !== organization.email) {
      const existing = await this.organizationRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Organization email already exists');
      }
    }

    // Store old values for audit log
    const oldValues = {
      name: organization.name,
      email: organization.email,
      description: organization.description,
      phone: organization.phone,
      address: organization.address,
    };

    // Update organization
    Object.assign(organization, dto);
    await this.organizationRepository.save(organization);

    // Create audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'organization.update',
      'organization',
      organizationId,
      oldValues,
      {
        name: organization.name,
        email: organization.email,
        description: organization.description,
        phone: organization.phone,
        address: organization.address,
      },
    );

    return organization;
  }

  async updateOrganizationSettings(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationSettingsDto,
  ): Promise<Organization & { requires_mfa_setup?: boolean; temp_setup_token?: string }> {
    // Verify user is organization owner
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can update organization settings');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get current user
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Get all active members for notifications
    const activeMembers = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    let tempSetupToken: string | undefined;
    let requiresMfaSetup = false;

    // If enabling MFA, notify all users and check if current user needs setup
    if (dto.mfa_enabled !== undefined && dto.mfa_enabled !== organization.mfa_enabled) {
      organization.mfa_enabled = dto.mfa_enabled;

      if (dto.mfa_enabled) {
        // Check if current user needs MFA setup
        if (!currentUser.mfa_enabled || !currentUser.mfa_setup_completed_at) {
          // Generate temporary token for MFA setup
          tempSetupToken = crypto.randomUUID();
          const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes for setup (increased from 15)
          const tempSetupTokenData = {
            user_id: currentUser.id,
            organization_id: organizationId,
            email: currentUser.email,
            role_id: membership.role_id,
            expires_at: expiresAt,
          };

          // Store in Redis for 30 minutes (increased from 15)
          await this.redisService.set(
            `mfa:setup:temp:${tempSetupToken}`,
            JSON.stringify(tempSetupTokenData),
            1800, // 30 minutes
          );

          requiresMfaSetup = true;
        }

        // Notify all organization members
        for (const member of activeMembers) {
          // Create in-app notification
          const notification = this.notificationRepository.create({
            user_id: member.user_id,
            organization_id: organizationId,
            type: 'mfa_enabled',
            title: '2FA/MFA Enabled',
            message: `2FA/MFA has been enabled for ${organization.name}. You will need to set up 2FA on your next login.`,
            data: {
              organization_id: organizationId,
              organization_name: organization.name,
            },
          });

          await this.notificationRepository.save(notification);

          // Send email notification
          await this.emailService.sendMfaEnabledEmail(
            member.user.email,
            member.user.first_name,
            organization.name,
          );
        }
      }
    }

    // Store old MFA status for audit log
    const oldMfaEnabled = organization.mfa_enabled;

    await this.organizationRepository.save(organization);

    // Create audit log for MFA status change
    if (dto.mfa_enabled !== undefined && dto.mfa_enabled !== oldMfaEnabled) {
      await this.auditLogsService.createAuditLog(
        organizationId,
        userId,
        dto.mfa_enabled ? 'mfa.enable' : 'mfa.disable',
        'organization',
        organizationId,
        { mfa_enabled: oldMfaEnabled },
        { mfa_enabled: dto.mfa_enabled },
      );
    }

    // Create audit log for other settings updates
    if (Object.keys(dto).some((key) => key !== 'mfa_enabled')) {
      await this.auditLogsService.createAuditLog(
        organizationId,
        userId,
        'organization.settings.update',
        'organization',
        organizationId,
        null,
        dto,
      );
    }

    // Return organization with MFA setup info if needed
    const result: Organization & { requires_mfa_setup?: boolean; temp_setup_token?: string } =
      organization;
    if (requiresMfaSetup && tempSetupToken) {
      result.requires_mfa_setup = true;
      result.temp_setup_token = tempSetupToken;
    }

    return result;
  }

  async getOrganizationStatistics(userId: string, organizationId: string): Promise<any> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get active user count
    const activeUsersCount = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    // Get organization-specific roles count
    const orgRolesCount = await this.roleRepository
      .createQueryBuilder('role')
      .where('role.organization_id = :orgId', { orgId: organizationId })
      .andWhere('role.is_active = :isActive', { isActive: true })
      .andWhere('role.deleted_at IS NULL')
      .getCount();

    // Get default/system roles count (always available to all organizations)
    const defaultRolesCount = await this.roleRepository
      .createQueryBuilder('role')
      .where('role.organization_id IS NULL')
      .andWhere('role.is_default = :isDefault', { isDefault: true })
      .andWhere('role.is_active = :isActive', { isActive: true })
      .andWhere('role.deleted_at IS NULL')
      .getCount();

    // Total roles = organization roles + default roles
    const totalRolesCount = orgRolesCount + defaultRolesCount;

    // Get pending invitations count
    const pendingInvitationsCount = await this.invitationRepository
      .createQueryBuilder('invitation')
      .where('invitation.organization_id = :orgId', { orgId: organizationId })
      .andWhere('invitation.status = :status', { status: 'pending' })
      .andWhere('invitation.expires_at > :now', { now: new Date() })
      .getCount();

    return {
      organization_id: organizationId,
      organization_name: organization.name,
      total_users: activeUsersCount,
      user_limit: organization.user_limit,
      user_usage_percentage: Math.round((activeUsersCount / organization.user_limit) * 100),
      total_roles: totalRolesCount,
      role_limit: organization.role_limit,
      role_usage_percentage: Math.round((totalRolesCount / organization.role_limit) * 100),
      pending_invitations: pendingInvitationsCount,
      mfa_enabled: organization.mfa_enabled,
      package: {
        id: organization.package_id,
        name: organization.package?.name || 'Unknown',
      },
    };
  }

  async switchOrganization(
    userId: string,
    organizationId: string,
  ): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }> {
    // Verify user is member of the target organization
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['organization', 'organization.package', 'role', 'user'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get user
    const user = membership.user || await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate new tokens with new organization_id
    const payload = {
      sub: user.id,
      email: user.email,
      organization_id: organizationId,
      role_id: membership.role_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    return {
      message: 'Organization switched successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    };
  }

  async updateOrganizationSlug(
    userId: string,
    organizationId: string,
    slug: string,
  ): Promise<Organization> {
    // Verify user is organization owner
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'organization', 'organization.package'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can update organization slug');
    }

    const organization = membership.organization;

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check package - only Basic, Platinum, and Diamond can change slug
    const packageSlug = organization.package?.slug;
    if (packageSlug === 'freemium') {
      throw new ForbiddenException(
        'Slug cannot be changed for Freemium package. Please upgrade to Basic, Platinum, or Diamond package to change your organization slug.',
      );
    }

    if (!['basic', 'platinum', 'diamond'].includes(packageSlug)) {
      throw new ForbiddenException(
        'Slug can only be changed for Basic, Platinum, or Diamond packages.',
      );
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

    if (normalizedSlug.length < 3 || normalizedSlug.length > 50) {
      throw new ConflictException('Slug must be between 3 and 50 characters');
    }

    // Check if slug is already taken
    if (normalizedSlug !== organization.slug) {
      const existing = await this.organizationRepository.findOne({
        where: { slug: normalizedSlug },
      });
      if (existing) {
        throw new ConflictException('This slug is already taken. Please choose a different one.');
      }
    }

    // Store old value for audit log
    const oldSlug = organization.slug;

    // Update slug
    organization.slug = normalizedSlug;
    await this.organizationRepository.save(organization);

    // Create audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'organization.slug_updated',
      'organization',
      organizationId,
      { slug: oldSlug },
      { slug: normalizedSlug },
    );

    return organization;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
