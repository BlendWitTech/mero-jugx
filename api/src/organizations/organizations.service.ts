import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Organization, OrganizationType, OrganizationStatus } from '../database/entities/organizations.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { Package } from '../database/entities/packages.entity';
import { Role } from '../database/entities/roles.entity';
import { Invitation } from '../database/entities/invitations.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { EmailService } from '../common/services/email.service';
import { RedisService } from '../common/services/redis.service';
import { Notification } from '../database/entities/notifications.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

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
  ) { }

  private async getActiveMembership(
    userId: string,
    organizationId: string,
    relations: string[] = [],
  ): Promise<OrganizationMember> {
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations,
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this organization');
    }

    return membership;
  }

  async getCurrentOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Organization & { current_user_role?: any }> {
    const membership = await this.getActiveMembership(userId, organizationId, [
      'organization',
      'organization.package',
      'role',
      'role.role_permissions',
      'role.role_permissions.permission',
    ]);

    const organization = membership.organization as any;
    organization.current_user_role = {
      role_id: membership.role_id,
      role_name: membership.role.name,
      is_organization_owner: membership.role.is_organization_owner,
      permissions: membership.role.role_permissions?.map(rp => rp.permission.slug) || [],
    };

    return organization;
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
    // 1. Verify user is organization owner or has edit permissions
    const membership = await this.getActiveMembership(userId, organizationId, [
      'role',
      'role.role_permissions',
      'role.role_permissions.permission',
      'organization',
      'organization.package'
    ]);

    const permissions = membership.role.role_permissions?.map(rp => rp.permission.slug) || [];

    if (!membership.role.is_organization_owner && !permissions.includes('organizations.edit')) {
      throw new ForbiddenException('Insufficient permissions to update organization');
    }

    const organization = membership.organization;

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
    // 1. Verify user is organization owner
    const membership = await this.getActiveMembership(userId, organizationId, ['role', 'organization']);

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can update organization settings');
    }

    const organization = membership.organization;

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
          const expiresAt = Date.now() + 30 * 60 * 1000;
          const tempSetupTokenData = {
            user_id: currentUser.id,
            organization_id: organizationId,
            email: currentUser.email,
            role_id: membership.role_id,
            expires_at: expiresAt,
          };

          // Store in Redis for 30 minutes
          await this.redisService.set(
            `mfa:setup:temp:${tempSetupToken}`,
            JSON.stringify(tempSetupTokenData),
            1800,
          );

          requiresMfaSetup = true;
        }

        // Notify all organization members
        for (const member of activeMembers) {
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

          if (member.user && member.user.email) {
            await this.emailService.sendMfaEnabledEmail(
              member.user.email,
              member.user.first_name,
              organization.name,
            );
          }
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

    const result: Organization & { requires_mfa_setup?: boolean; temp_setup_token?: string } = organization;
    if (requiresMfaSetup && tempSetupToken) {
      result.requires_mfa_setup = true;
      result.temp_setup_token = tempSetupToken;
    }

    return result;
  }

  async getOrganizationStatistics(userId: string, organizationId: string): Promise<any> {
    await this.getActiveMembership(userId, organizationId);

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
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
    const membership = await this.getActiveMembership(userId, organizationId, [
      'organization',
      'organization.package',
      'role',
      'user',
    ]);

    const user = membership.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }

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
    const membership = await this.getActiveMembership(userId, organizationId, [
      'role',
      'organization',
      'organization.package',
    ]);

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can update organization slug');
    }

    const organization = membership.organization;

    const packageSlug = organization.package?.slug;
    if (packageSlug === 'freemium') {
      throw new ForbiddenException(
        'Slug cannot be changed for Freemium package. Please upgrade to Basic, Platinum, or Diamond package to change your organization slug.',
      );
    }

    if (!['basic', 'platinum', 'diamond'].includes(packageSlug || '')) {
      throw new ForbiddenException(
        'Slug can only be changed for Basic, Platinum, or Diamond packages.',
      );
    }

    const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

    if (normalizedSlug.length < 3 || normalizedSlug.length > 50) {
      throw new ConflictException('Slug must be between 3 and 50 characters');
    }

    if (normalizedSlug !== organization.slug) {
      const existing = await this.organizationRepository.findOne({
        where: { slug: normalizedSlug },
      });
      if (existing) {
        throw new ConflictException('This slug is already taken. Please choose a different one.');
      }
    }

    const oldSlug = organization.slug;
    organization.slug = normalizedSlug;
    await this.organizationRepository.save(organization);

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

  async createBranch(
    userId: string,
    parentId: string,
    dto: CreateBranchDto,
  ): Promise<Organization> {
    try {
      this.logger.debug(`Creating branch for parent ${parentId} by user ${userId} with name ${dto.name}`);

      const parentOrg = await this.organizationRepository.findOne({
        where: { id: parentId },
        relations: ['package'],
      });

      if (!parentOrg) {
        throw new NotFoundException('Parent organization not found');
      }

      if (parentOrg.org_type !== OrganizationType.MAIN) {
        throw new ForbiddenException('Only a Main Organization can have branches');
      }

      const membership = await this.getActiveMembership(userId, parentId, ['role']);

      if (!membership.role.is_organization_owner) {
        throw new ForbiddenException('Only organization owners can create branches');
      }

      const branchSlug = this.generateSlug(`${parentOrg.name}-${dto.name}`);

      const existing = await this.organizationRepository.findOne({ where: { slug: branchSlug } });
      if (existing) {
        throw new ConflictException('A branch or organization with this name already exists');
      }

      const branch = this.organizationRepository.create({
        ...dto,
        slug: branchSlug,
        email: dto.email || parentOrg.email,
        parent_id: parentId,
        org_type: OrganizationType.BRANCH,
        status: OrganizationStatus.ACTIVE,
        package_id: parentOrg.package_id,
        package_expires_at: parentOrg.package_expires_at,
        email_verified: true,
        user_limit: parentOrg.user_limit,
        role_limit: parentOrg.role_limit,
      });

      const savedBranch = await this.organizationRepository.save(branch);

      const branchMembership = this.memberRepository.create({
        user_id: userId,
        organization_id: savedBranch.id,
        role_id: membership.role_id,
        status: OrganizationMemberStatus.ACTIVE,
        joined_at: new Date(),
      });

      await this.memberRepository.save(branchMembership);

      await this.auditLogsService.createAuditLog(
        parentId,
        userId,
        'branch.create',
        'organization',
        savedBranch.id,
        null,
        { name: savedBranch.name, slug: savedBranch.slug },
      );

      return savedBranch;
    } catch (error: any) {
      this.logger.error(`Error creating branch: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBranches(userId: string, parentId: string): Promise<Organization[]> {
    try {
      await this.getActiveMembership(userId, parentId);

      const branches = await this.organizationRepository.find({
        where: {
          parent_id: parentId,
          status: OrganizationStatus.ACTIVE
        },
        order: { created_at: 'DESC' },
      });

      return branches;
    } catch (error: any) {
      this.logger.error(`Error in getBranches: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
