import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserAppAccess } from '../database/entities/user_app_access.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { OrganizationApp, OrganizationAppStatus } from '../database/entities/organization_apps.entity';
import { App } from '../database/entities/apps.entity';
import { User } from '../database/entities/users.entity';
import { Organization } from '../database/entities/organizations.entity';
import { GrantAppAccessDto } from './dto/grant-app-access.dto';
import { RevokeAppAccessDto } from './dto/revoke-app-access.dto';
import { NotificationHelperService, NotificationType } from '../notifications/notification-helper.service';
import { EmailService } from '../common/services/email.service';
import { NotificationPreference } from '../database/entities/notification_preferences.entity';

@Injectable()
export class AppAccessService {
  constructor(
    @InjectRepository(UserAppAccess)
    private appAccessRepository: Repository<UserAppAccess>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(OrganizationApp)
    private orgAppRepository: Repository<OrganizationApp>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private notificationHelper: NotificationHelperService,
    private emailService: EmailService,
  ) { }

  /**
   * Check if user can grant app access
   */
  private async canGrantAccess(
    granterId: string,
    organizationId: string,
    targetUserId: string,
  ): Promise<{ canGrant: boolean; reason?: string }> {
    const granter = await this.memberRepository.findOne({
      where: {
        user_id: granterId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!granter) {
      return { canGrant: false, reason: 'You are not a member of this organization' };
    }

    const target = await this.memberRepository.findOne({
      where: {
        user_id: targetUserId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!target) {
      return { canGrant: false, reason: 'Target user is not a member of this organization' };
    }

    const isGranterOwner = granter.role?.is_organization_owner;
    // Check if granter is admin by checking role slug or permissions
    const isGranterAdmin = granter.role?.slug === 'admin' ||
      granter.role?.role_permissions?.some((rp) => rp.permission.slug === 'apps.manage') || false;

    // Check if target is admin
    const isTargetAdmin = target.role?.slug === 'admin' ||
      target.role?.role_permissions?.some((rp) => rp.permission.slug === 'apps.manage') || false;

    // Only owner can assign apps to admin
    if (isTargetAdmin && !isGranterOwner) {
      return { canGrant: false, reason: 'Only organization owner can assign apps to admin' };
    }

    // Admin cannot assign apps to admin
    if (isTargetAdmin && isGranterAdmin && !isGranterOwner) {
      return { canGrant: false, reason: 'Admin cannot assign apps to admin' };
    }

    // Owner and admin can grant access
    if (isGranterOwner || isGranterAdmin) {
      return { canGrant: true };
    }

    return { canGrant: false, reason: 'You do not have permission to grant app access' };
  }

  /**
   * Check if user has access to an app
   */
  async hasAccess(
    userId: string,
    organizationId: string,
    appId: number,
  ): Promise<boolean> {
    const access = await this.appAccessRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        app_id: appId,
        is_active: true,
      },
    });

    return !!access;
  }

  /**
   * Grant app access to a user
   */
  async grantAccess(
    granterId: string,
    organizationId: string,
    dto: GrantAppAccessDto,
    origin?: string,
  ): Promise<UserAppAccess> {
    // Verify app exists and is subscribed
    const app = await this.appRepository.findOne({ where: { id: dto.app_id } });
    if (!app) {
      throw new NotFoundException('App not found');
    }

    const subscription = await this.orgAppRepository.findOne({
      where: {
        organization_id: organizationId,
        app_id: dto.app_id,
        status: In([OrganizationAppStatus.ACTIVE, OrganizationAppStatus.TRIAL]),
      },
    });

    if (!subscription) {
      throw new BadRequestException('App is not subscribed by this organization. Please subscribe to the app first.');
    }

    // Check permissions
    const { canGrant, reason } = await this.canGrantAccess(granterId, organizationId, dto.user_id);
    if (!canGrant) {
      throw new ForbiddenException(reason);
    }

    // Check if access already exists
    const existing = await this.appAccessRepository.findOne({
      where: {
        user_id: dto.user_id,
        organization_id: organizationId,
        app_id: dto.app_id,
      },
    });

    if (existing) {
      if (existing.is_active) {
        throw new BadRequestException('User already has access to this app');
      }
      // Reactivate existing access
      existing.is_active = true;
      existing.granted_by = granterId;
      if (dto.role_id) {
        existing.role_id = dto.role_id;
      }
      return this.appAccessRepository.save(existing);
    }

    // Get target member
    const targetMember = await this.memberRepository.findOne({
      where: {
        user_id: dto.user_id,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    const access = this.appAccessRepository.create({
      user_id: dto.user_id,
      organization_id: organizationId,
      app_id: dto.app_id,
      granted_by: granterId,
      member_id: targetMember?.id || null,
      role_id: dto.role_id || null,
      is_active: true,
    });

    const savedAccess = await this.appAccessRepository.save(access);

    // Get user and organization details for notifications
    const user = await this.userRepository.findOne({ where: { id: dto.user_id } });
    const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
    const granter = await this.userRepository.findOne({ where: { id: granterId } });

    // Send in-app notification
    await this.notificationHelper.notifyAppAccessGranted(
      dto.user_id,
      organizationId,
      app.name,
      dto.app_id,
      granterId,
    );

    // Send email notification if enabled
    if (user && organization) {
      const shouldSendEmail = await this.notificationHelper.shouldSendEmail(
        dto.user_id,
        organizationId,
        NotificationType.APP_ACCESS_GRANTED,
      );

      if (shouldSendEmail) {
        try {
          await this.emailService.sendAppAccessGrantedEmail(
            user.email,
            `${user.first_name} ${user.last_name}`.trim(),
            organization.name,
            app.name,
            granter ? `${granter.first_name} ${granter.last_name}`.trim() : 'Administrator',
            false,
            false,
            origin,
          );
        } catch (error) {
          console.error('Error sending app access granted email:', error);
          // Don't fail the request if email fails
        }
      }

      // Send email to organization owner if different from granter
      const orgOwner = await this.memberRepository.findOne({
        where: {
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role', 'user'],
      });

      if (orgOwner && orgOwner.role?.is_organization_owner && orgOwner.user_id !== granterId && orgOwner.user) {
        const ownerShouldSendEmail = await this.notificationHelper.shouldSendEmail(
          orgOwner.user_id,
          organizationId,
          NotificationType.APP_ACCESS_GRANTED,
        );

        if (ownerShouldSendEmail) {
          try {
            await this.emailService.sendAppAccessGrantedEmail(
              orgOwner.user.email,
              `${orgOwner.user.first_name} ${orgOwner.user.last_name}`.trim(),
              organization.name,
              app.name,
              granter ? `${granter.first_name} ${granter.last_name}`.trim() : 'Administrator',
              true, // isOwner
              false, // isActionPerformer
              origin,
            );
          } catch (error) {
            console.error('Error sending app access granted email to owner:', error);
          }
        }
      }

      // Send email to action performer (granter) if enabled
      if (granter && granter.id !== dto.user_id) {
        const granterShouldSendEmail = await this.notificationHelper.shouldSendEmail(
          granterId,
          organizationId,
          NotificationType.APP_ACCESS_GRANTED,
        );

        if (granterShouldSendEmail) {
          try {
            await this.emailService.sendAppAccessGrantedEmail(
              granter.email,
              `${granter.first_name} ${granter.last_name}`.trim(),
              organization.name,
              app.name,
              `${granter.first_name} ${granter.last_name}`.trim(),
              false, // isOwner
              true, // isActionPerformer
              origin,
            );
          } catch (error) {
            console.error('Error sending app access granted email to granter:', error);
          }
        }
      }
    }

    return savedAccess;
  }

  /**
   * Revoke app access from a user
   */
  async revokeAccess(
    revokerId: string,
    organizationId: string,
    dto: RevokeAppAccessDto,
    origin?: string,
  ): Promise<void> {
    const access = await this.appAccessRepository.findOne({
      where: {
        user_id: dto.user_id,
        organization_id: organizationId,
        app_id: dto.app_id,
      },
    });

    if (!access) {
      throw new NotFoundException('App access not found');
    }

    // Check permissions (same as grant)
    const { canGrant, reason } = await this.canGrantAccess(revokerId, organizationId, dto.user_id);
    if (!canGrant) {
      throw new ForbiddenException(reason);
    }

    access.is_active = false;
    await this.appAccessRepository.save(access);

    // Get user and organization details for notifications
    const user = await this.userRepository.findOne({ where: { id: dto.user_id } });
    const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
    const app = await this.appRepository.findOne({ where: { id: dto.app_id } });
    const revoker = await this.userRepository.findOne({ where: { id: revokerId } });

    // Send in-app notification
    if (app) {
      await this.notificationHelper.notifyAppAccessRevoked(
        dto.user_id,
        organizationId,
        app.name,
        dto.app_id,
        revokerId,
      );
    }

    // Send email notification if enabled
    if (user && organization && app) {
      const shouldSendEmail = await this.notificationHelper.shouldSendEmail(
        dto.user_id,
        organizationId,
        NotificationType.APP_ACCESS_REVOKED,
      );

      if (shouldSendEmail) {
        try {
          await this.emailService.sendAppAccessRevokedEmail(
            user.email,
            `${user.first_name} ${user.last_name}`.trim(),
            organization.name,
            app.name,
            revoker ? `${revoker.first_name} ${revoker.last_name}`.trim() : 'Administrator',
            false,
            false,
            origin,
          );
        } catch (error) {
          console.error('Error sending app access revoked email:', error);
          // Don't fail the request if email fails
        }
      }

      // Send email to organization owner if different from revoker
      const orgOwner = await this.memberRepository.findOne({
        where: {
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role', 'user'],
      });

      if (orgOwner && orgOwner.role?.is_organization_owner && orgOwner.user_id !== revokerId && orgOwner.user) {
        const ownerShouldSendEmail = await this.notificationHelper.shouldSendEmail(
          orgOwner.user_id,
          organizationId,
          NotificationType.APP_ACCESS_REVOKED,
        );

        if (ownerShouldSendEmail) {
          try {
            await this.emailService.sendAppAccessRevokedEmail(
              orgOwner.user.email,
              `${orgOwner.user.first_name} ${orgOwner.user.last_name}`.trim(),
              organization.name,
              app.name,
              revoker ? `${revoker.first_name} ${revoker.last_name}`.trim() : 'Administrator',
              true, // isOwner
              false, // isActionPerformer
              origin,
            );
          } catch (error) {
            console.error('Error sending app access revoked email to owner:', error);
          }
        }
      }

      // Send email to action performer (revoker) if enabled
      if (revoker && revoker.id !== dto.user_id) {
        const revokerShouldSendEmail = await this.notificationHelper.shouldSendEmail(
          revokerId,
          organizationId,
          NotificationType.APP_ACCESS_REVOKED,
        );

        if (revokerShouldSendEmail) {
          try {
            await this.emailService.sendAppAccessRevokedEmail(
              revoker.email,
              `${revoker.first_name} ${revoker.last_name}`.trim(),
              organization.name,
              app.name,
              `${revoker.first_name} ${revoker.last_name}`.trim(),
              false, // isOwner
              true, // isActionPerformer
              origin,
            );
          } catch (error) {
            console.error('Error sending app access revoked email to revoker:', error);
          }
        }
      }
    }
  }

  /**
   * Get app access for a user
   */
  async getUserAppAccess(userId: string, organizationId: string, appId: number): Promise<boolean> {
    const access = await this.appAccessRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        app_id: appId,
        is_active: true,
      },
    });

    return !!access;
  }

  /**
   * Get all users with access to an app
   */
  async getAppAccessUsers(organizationId: string, appId: number) {
    try {
      const accesses = await this.appAccessRepository.find({
        where: {
          organization_id: organizationId,
          app_id: appId,
          is_active: true,
        },
        relations: ['user', 'granter', 'member', 'member.role', 'role'],
      });

      return {
        data: accesses.map((access) => ({
          id: access.id,
          user: access.user ? {
            id: access.user.id,
            first_name: access.user.first_name,
            last_name: access.user.last_name,
            email: access.user.email,
          } : null,
          granted_by: access.granter ? {
            id: access.granter.id,
            first_name: access.granter.first_name,
            last_name: access.granter.last_name,
            email: access.granter.email,
          } : null,
          member: access.member ? {
            id: access.member.id,
            role: access.member.role ? {
              id: access.member.role.id,
              name: access.member.role.name,
              slug: access.member.role.slug,
              is_organization_owner: access.member.role.is_organization_owner,
            } : null,
          } : null,
          created_at: access.created_at,
        })),
      };
    } catch (error) {
      console.error('Error fetching app access users:', error);
      // If relations fail, try without relations
      const accesses = await this.appAccessRepository.find({
        where: {
          organization_id: organizationId,
          app_id: appId,
          is_active: true,
        },
      });

      // Fetch users separately
      const userIds = accesses.map(a => a.user_id).filter((id): id is string => !!id);
      const users = userIds.length > 0 ? await this.userRepository.find({
        where: { id: In(userIds) },
      }) : [];

      return {
        data: accesses.map((access) => {
          const user = users.find(u => u.id === access.user_id);
          return {
            id: access.id,
            user: user ? {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            } : null,
            granted_by: null,
            member: null,
            created_at: access.created_at,
            role: access.role ? {
              id: access.role.id,
              name: access.role.name,
              slug: access.role.slug,
            } : null,
          };
        }),
      };
    }
  }

  /**
   * Get all apps a user has access to
   */
  async getUserAccessibleApps(userId: string, organizationId: string) {
    const accesses = await this.appAccessRepository.find({
      where: {
        user_id: userId,
        organization_id: organizationId,
        is_active: true,
      },
      relations: ['app'],
    });

    return accesses.map((access) => access.app);
  }
}

