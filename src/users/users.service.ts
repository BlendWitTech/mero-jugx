import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { Session } from '../database/entities/session.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Notification } from '../database/entities/notification.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RevokeAccessDto } from './dto/revoke-access.dto';
import { EmailService } from '../common/services/email.service';
import {
  NotificationHelperService,
  NotificationType,
} from '../notifications/notification-helper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPreferenceScope } from '../database/entities/notification-preference.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private notificationHelper: NotificationHelperService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async getCurrentUser(userId: string, organizationId: string): Promise<User> {
    // Verify user is member of organization
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership.user;
  }

  async updateCurrentUser(
    userId: string,
    organizationId: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    // Verify user is member of organization
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

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user
    Object.assign(user, dto);
    await this.userRepository.save(user);

    return user;
  }

  async getOrganizationUsers(
    userId: string,
    organizationId: string,
    query: UserQueryDto,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify user is member of organization
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

    // Check permission (users.view)
    if (membership.role.is_organization_owner) {
      // Organization owner has all permissions
    } else {
      // Load role with permissions
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'users.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view users');
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.role', 'role')
      .where('member.organization_id = :organizationId', { organizationId })
      .andWhere('member.status = :status', {
        status: OrganizationMemberStatus.ACTIVE,
      });

    // Apply filters
    if (query.search) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.role_id) {
      queryBuilder.andWhere('member.role_id = :roleId', { roleId: query.role_id });
    }

    if (query.status) {
      queryBuilder.andWhere('user.status = :userStatus', {
        userStatus: query.status,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const members = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Map members to include user with role information
    const users = members.map((member) => ({
      ...member.user,
      fullName: `${member.user.first_name} ${member.user.last_name}`,
      role: member.role
        ? {
            id: member.role.id,
            name: member.role.name,
            slug: member.role.slug,
          }
        : null,
      membership_status: member.status,
      joined_at: member.joined_at,
    }));

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string, organizationId: string, targetUserId: string): Promise<User> {
    // Verify requesting user is member of organization
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

    // Check permission (users.view)
    if (membership.role.is_organization_owner) {
      // Organization owner has all permissions
    } else {
      // Load role with permissions
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'users.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view users');
      }
    }

    // Verify target user is member of organization
    const targetMembership = await this.memberRepository.findOne({
      where: {
        user_id: targetUserId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user', 'role'],
    });

    if (!targetMembership) {
      throw new NotFoundException('User not found in this organization');
    }

    return targetMembership.user;
  }

  async updateUser(
    userId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateUserAdminDto,
  ): Promise<User> {
    // Verify requesting user is member of organization
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

    // Check permission (users.edit)
    if (membership.role.is_organization_owner) {
      // Organization owner has all permissions
    } else {
      // Load role with permissions
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'users.edit',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to edit users');
      }
    }

    // Verify target user is member of organization
    const targetMembership = await this.memberRepository.findOne({
      where: {
        user_id: targetUserId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user', 'role'],
    });

    if (!targetMembership) {
      throw new NotFoundException('User not found in this organization');
    }

    if (!targetMembership.role) {
      throw new NotFoundException('Target user role information is missing');
    }

    // Organization Owner cannot be edited by anyone except themselves
    if (targetMembership.role.is_organization_owner && targetUserId !== userId) {
      throw new BadRequestException(
        'Organization Owner cannot be edited by any other user. Only the Organization Owner can edit their own profile.',
      );
    }

    // Check role hierarchy - requesting user must have a higher role (lower level number) to edit
    if (!membership.role.is_organization_owner) {
      const requestingRoleLevel = this.getRoleHierarchyLevel(membership.role);
      const targetRoleLevel = this.getRoleHierarchyLevel(targetMembership.role);

      // Cannot edit users with same or higher role level
      if (targetRoleLevel <= requestingRoleLevel) {
        if (targetRoleLevel === requestingRoleLevel) {
          throw new BadRequestException(
            `You cannot edit users with the same role level (${targetMembership.role.name}). You can only edit users with lower role levels.`,
          );
        } else {
          throw new BadRequestException(
            `You cannot edit users with a higher role level (${targetMembership.role.name}). You can only edit users with lower role levels.`,
          );
        }
      }
    }

    const user = targetMembership.user;

    // Check if email is being changed and if it's unique
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    // Track what changed for notification
    const changes: string[] = [];
    if (dto.first_name && dto.first_name !== user.first_name) changes.push('first name');
    if (dto.last_name && dto.last_name !== user.last_name) changes.push('last name');
    if (dto.email && dto.email !== user.email) changes.push('email');
    if (dto.phone && dto.phone !== user.phone) changes.push('phone');

    // Update user
    Object.assign(user, dto);
    await this.userRepository.save(user);

    // Notify user if their profile was updated by admin
    if (changes.length > 0 && userId !== targetUserId) {
      const notification = this.notificationRepository.create({
        user_id: targetUserId,
        organization_id: organizationId,
        type: 'profile_updated',
        title: 'Profile Updated',
        message: `Your profile has been updated: ${changes.join(', ')}`,
        data: {
          updated_by: userId,
          changes,
        },
      });
      await this.notificationRepository.save(notification);
    }

    // Notify organization owners about user updates
    if (changes.length > 0) {
      const organization = await this.dataSource
        .getRepository(require('../database/entities/organization.entity').Organization)
        .findOne({ where: { id: organizationId } });

      if (organization) {
        // Get organization owners
        const owners = await this.memberRepository.find({
          where: {
            organization_id: organizationId,
            status: OrganizationMemberStatus.ACTIVE,
          },
          relations: ['role', 'user'],
        });

        const seniorMembers = owners.filter(
          (m) => m.role.is_organization_owner || userId !== m.user_id,
        );

        const notifications = seniorMembers.map((member) =>
          this.notificationRepository.create({
            user_id: member.user_id,
            organization_id: organizationId,
            type: 'user_updated',
            title: 'User Profile Updated',
            message: `User ${user.first_name} ${user.last_name}'s profile has been updated: ${changes.join(', ')}`,
            data: {
              target_user_id: targetUserId,
              updated_by: userId,
              changes,
            },
          }),
        );

        if (notifications.length > 0) {
          await this.notificationRepository.save(notifications);
        }
      }
    }

    return user;
  }

  /**
   * Get role hierarchy level
   * Organization Owner = 1 (highest)
   * Admin = 2
   * Other roles = 3+ (based on creation order or custom logic)
   */
  private getRoleHierarchyLevel(role: Role): number {
    if (role.is_organization_owner) {
      return 1; // Highest level
    }
    // Admin role can be identified by slug 'admin' or by being a default/system role with admin-like permissions
    if (
      role.slug === 'admin' ||
      (role.is_default && role.slug === 'admin') ||
      (role.is_system_role && role.slug === 'admin')
    ) {
      return 2; // Second level
    }
    // For other roles, use creation order or a default level
    return 3; // Default level for custom roles
  }

  async revokeAccess(
    userId: string,
    organizationId: string,
    targetUserId: string,
    dto: RevokeAccessDto,
  ): Promise<{ message: string; revoked_user: User }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify requesting user is member of organization
      const requestingMembership = await this.memberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role'],
      });

      if (!requestingMembership) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      if (!requestingMembership.role) {
        throw new ForbiddenException('Your role information is missing. Please contact support.');
      }

      // Check permission (users.revoke)
      if (!requestingMembership.role.is_organization_owner) {
        const roleWithPermissions = await this.roleRepository.findOne({
          where: { id: requestingMembership.role_id },
          relations: ['role_permissions', 'role_permissions.permission'],
        });

        const hasPermission = roleWithPermissions?.role_permissions?.some(
          (rp) => rp.permission.slug === 'users.revoke',
        );

        if (!hasPermission) {
          throw new ForbiddenException('You do not have permission to revoke user access');
        }
      }

      // Verify target user is member of organization
      const targetMembership = await this.memberRepository.findOne({
        where: {
          user_id: targetUserId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['user', 'role'],
      });

      if (!targetMembership) {
        throw new NotFoundException('User not found in this organization');
      }

      if (!targetMembership.role) {
        throw new NotFoundException('Target user role information is missing');
      }

      // Cannot revoke own access
      if (targetUserId === userId) {
        throw new BadRequestException('You cannot revoke your own access');
      }

      // Organization Owner can only revoke themselves (which is blocked above)
      // No one else can revoke Organization Owner
      if (targetMembership.role.is_organization_owner) {
        throw new BadRequestException(
          'Organization Owner access cannot be revoked by any other user. Only the Organization Owner can manage their own access.',
        );
      }

      // Check role hierarchy - requesting user must have a higher role (lower level number)
      const requestingRoleLevel = this.getRoleHierarchyLevel(requestingMembership.role);
      const targetRoleLevel = this.getRoleHierarchyLevel(targetMembership.role);

      // Cannot revoke users with same or higher role level
      if (targetRoleLevel <= requestingRoleLevel) {
        if (targetRoleLevel === requestingRoleLevel) {
          throw new BadRequestException(
            `You cannot revoke access for users with the same role level (${targetMembership.role.name}). You can only revoke access for users with lower role levels.`,
          );
        } else {
          throw new BadRequestException(
            `You cannot revoke access for users with a higher role level (${targetMembership.role.name}). You can only revoke access for users with lower role levels.`,
          );
        }
      }

      // Handle data transfer if requested
      let transferToUserId: string | null = null;

      if (dto.transfer_data && dto.transfer_to_user_id) {
        // Verify transfer recipient is member of organization
        const transferToMembership = await this.memberRepository.findOne({
          where: {
            user_id: dto.transfer_to_user_id,
            organization_id: organizationId,
            status: OrganizationMemberStatus.ACTIVE,
          },
          relations: ['role'],
        });

        if (!transferToMembership) {
          throw new NotFoundException('Transfer recipient not found in this organization');
        }

        // Verify same role (transfer recipient must have same role as revoked user)
        if (transferToMembership.role_id !== targetMembership.role_id) {
          throw new BadRequestException(
            'Transfer recipient must have the same role as the revoked user',
          );
        }

        transferToUserId = dto.transfer_to_user_id;

        // Transfer data ownership
        // Note: In a real application, you would transfer ownership of:
        // - Created records/entities
        // - Assigned tasks/projects
        // - Any other user-created data
        // For now, we'll just mark the transfer in the membership record
      }

      // Revoke all active sessions for this user in this organization
      await this.sessionRepository.update(
        {
          user_id: targetUserId,
          organization_id: organizationId,
          revoked_at: null, // Only revoke non-revoked sessions
        },
        {
          revoked_at: new Date(),
        },
      );

      // Update membership status
      targetMembership.status = OrganizationMemberStatus.REVOKED;
      targetMembership.revoked_at = new Date();
      targetMembership.revoked_by = userId;
      targetMembership.data_transferred_to = transferToUserId;

      await this.memberRepository.save(targetMembership);

      // Create audit log
      const auditLog = this.auditLogRepository.create({
        organization_id: organizationId,
        user_id: userId,
        action: 'user.revoke',
        entity_type: 'user',
        entity_id: targetUserId,
        old_values: {
          status: OrganizationMemberStatus.ACTIVE,
          role_id: targetMembership.role_id,
        },
        new_values: {
          status: OrganizationMemberStatus.REVOKED,
          revoked_at: targetMembership.revoked_at,
          revoked_by: userId,
          data_transferred_to: transferToUserId,
          reason: dto.reason,
        },
        metadata: {
          reason: dto.reason,
          transfer_data: dto.transfer_data || false,
        },
      });

      await this.auditLogRepository.save(auditLog);

      // Get requesting user details for notification
      const requestingUser = await this.userRepository.findOne({
        where: { id: userId },
      });
      const requestingUserName = requestingUser
        ? `${requestingUser.first_name} ${requestingUser.last_name}`
        : 'Administrator';

      // Get organization details
      const organization = await this.dataSource
        .getRepository(require('../database/entities/organization.entity').Organization)
        .findOne({ where: { id: organizationId } });

      // Create notification for revoked user
      await this.notificationHelper.createNotification(
        targetUserId,
        organizationId,
        NotificationType.USER_REMOVED,
        'Access Revoked',
        `${requestingUserName} has revoked your access to ${organization?.name || 'this organization'}${dto.reason ? `: ${dto.reason}` : '.'}`,
        {
          route: '/organizations',
        },
        {
          organization_id: organizationId,
          organization_name: organization?.name,
          revoked_by: userId,
          revoked_by_name: requestingUserName,
          reason: dto.reason,
        },
      );

      // Check user's notification preferences before sending email
      let shouldSendEmail = true;
      try {
        // Get personal preferences (not organization-level)
        const userPreferences = await this.notificationsService.getNotificationPreferences(
          targetUserId,
          organizationId,
          NotificationPreferenceScope.PERSONAL,
        );
        // Check if user has email notifications enabled for access revoked events
        const accessRevokedPref = userPreferences.preferences?.access_revoked;
        if (
          accessRevokedPref !== undefined &&
          typeof accessRevokedPref === 'object' &&
          'email' in accessRevokedPref
        ) {
          shouldSendEmail = accessRevokedPref.email !== false;
        } else {
          // Default to email_enabled setting
          shouldSendEmail = userPreferences.email_enabled !== false;
        }
      } catch (error) {
        // If preferences can't be fetched, default to sending email
        console.warn('Could not fetch notification preferences, defaulting to send email:', error);
      }

      // Send email notification if enabled
      if (shouldSendEmail && organization) {
        try {
          await this.emailService.sendAccessRevokedEmail(
            targetMembership.user.email,
            targetMembership.user.first_name,
            organization.name,
            dto.reason,
          );
        } catch (error) {
          console.error('Failed to send access revoked email:', error);
          // Don't fail the revocation if email fails
        }
      }

      // If data was transferred, notify the recipient
      if (transferToUserId) {
        const transferToUser = await this.userRepository.findOne({
          where: { id: transferToUserId },
        });

        if (transferToUser) {
          const transferNotification = this.notificationRepository.create({
            user_id: transferToUserId,
            organization_id: organizationId,
            type: 'data_transferred',
            title: 'Data Ownership Transferred',
            message: `You have been assigned data ownership from ${targetMembership.user.first_name} ${targetMembership.user.last_name} (${targetMembership.user.email}).`,
            data: {
              organization_id: organizationId,
              transferred_from_user_id: targetUserId,
              transferred_from_user_name: `${targetMembership.user.first_name} ${targetMembership.user.last_name}`,
            },
          });

          await this.notificationRepository.save(transferNotification);

          await this.emailService.sendDataTransferredEmail(
            transferToUser.email,
            transferToUser.first_name,
            `${targetMembership.user.first_name} ${targetMembership.user.last_name}`,
            targetMembership.user.email,
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: 'User access revoked successfully',
        revoked_user: targetMembership.user,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
