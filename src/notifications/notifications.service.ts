import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import {
  NotificationPreference,
  NotificationPreferenceScope,
} from '../database/entities/notification-preference.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { NotificationQueryDto, NotificationReadStatus } from './dto/notification-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async getNotifications(
    userId: string,
    organizationId: string,
    query: NotificationQueryDto,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unread_count: number;
    read_count: number;
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
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .andWhere(
        '(notification.organization_id = :organizationId OR notification.organization_id IS NULL)',
        {
          organizationId,
        },
      );

    // Apply filters
    if (query.read_status) {
      if (query.read_status === NotificationReadStatus.READ) {
        queryBuilder.andWhere('notification.read_at IS NOT NULL');
      } else if (query.read_status === NotificationReadStatus.UNREAD) {
        queryBuilder.andWhere('notification.read_at IS NULL');
      }
    }

    if (query.type) {
      queryBuilder.andWhere('notification.type = :type', { type: query.type });
    }

    if (query.organization_id) {
      queryBuilder.andWhere('notification.organization_id = :orgId', {
        orgId: query.organization_id,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        user_id: userId,
        organization_id: organizationId,
        read_at: null,
      },
    });

    // Get read count
    const readCount = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .andWhere(
        '(notification.organization_id = :organizationId OR notification.organization_id IS NULL)',
        {
          organizationId,
        },
      )
      .andWhere('notification.read_at IS NOT NULL')
      .getCount();

    // Get paginated results
    const notifications = await queryBuilder
      .orderBy('notification.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      notifications,
      total,
      unread_count: unreadCount,
      read_count: readCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getNotificationById(
    userId: string,
    organizationId: string,
    notificationId: string,
  ): Promise<Notification> {
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

    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(
    userId: string,
    organizationId: string,
    notificationId: string,
    dto: MarkReadDto,
  ): Promise<Notification> {
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

    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (dto.read === false) {
      // Mark as unread
      notification.read_at = null;
    } else {
      // Mark as read
      if (!notification.read_at) {
        notification.read_at = new Date();
      }
    }

    await this.notificationRepository.save(notification);

    return notification;
  }

  async markAllAsRead(
    userId: string,
    organizationId: string,
  ): Promise<{ message: string; count: number }> {
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

    // Mark all unread notifications as read for this user in this organization
    // This includes both organization-specific and personal notifications
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({ read_at: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('(organization_id = :organizationId OR organization_id IS NULL)', {
        organizationId,
      })
      .andWhere('read_at IS NULL')
      .execute();

    return {
      message: 'All notifications marked as read',
      count: result.affected || 0,
    };
  }

  async deleteNotification(
    userId: string,
    organizationId: string,
    notificationId: string,
  ): Promise<{ message: string }> {
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

    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);

    return { message: 'Notification deleted successfully' };
  }

  async getUnreadCount(
    userId: string,
    organizationId: string | null,
  ): Promise<{ unread_count: number; read_count: number }> {
    try {
      if (!organizationId) {
        return { unread_count: 0, read_count: 0 };
      }

      // Verify user is member of organization
      const membership = await this.memberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
      });

      if (!membership) {
        return { unread_count: 0, read_count: 0 };
      }

      // Count unread notifications for this user in this organization (including personal)
      const unreadCount = await this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.user_id = :userId', { userId })
        .andWhere(
          '(notification.organization_id = :organizationId OR notification.organization_id IS NULL)',
          {
            organizationId,
          },
        )
        .andWhere('notification.read_at IS NULL')
        .getCount();

      // Count read notifications for this user in this organization (including personal)
      const readCount = await this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.user_id = :userId', { userId })
        .andWhere(
          '(notification.organization_id = :organizationId OR notification.organization_id IS NULL)',
          {
            organizationId,
          },
        )
        .andWhere('notification.read_at IS NOT NULL')
        .getCount();

      return { unread_count: unreadCount, read_count: readCount };
    } catch (error: any) {
      console.error('Error in getUnreadCount:', error);
      // Return zero counts on error to prevent UI breaking
      return { unread_count: 0, read_count: 0 };
    }
  }

  /**
   * Get notification preferences for a user
   * - If organizationId is provided and user is Organization Owner, can get both personal and organization settings
   * - Otherwise, only personal settings are returned
   */
  async getNotificationPreferences(
    userId: string,
    organizationId: string | null,
    scope?: NotificationPreferenceScope,
  ): Promise<{
    email_enabled: boolean;
    in_app_enabled: boolean;
    preferences: Record<string, any>;
    scope?: NotificationPreferenceScope;
  }> {
    try {
      // Determine scope - default to personal if not specified
      let preferenceScope = scope || NotificationPreferenceScope.PERSONAL;

      // For personal scope, organization_id should be null
      let queryOrganizationId: string | null = null;

      // If organization scope is requested, verify user is Organization Owner
      if (preferenceScope === NotificationPreferenceScope.ORGANIZATION && organizationId) {
        const membership = await this.memberRepository.findOne({
          where: {
            user_id: userId,
            organization_id: organizationId,
            status: OrganizationMemberStatus.ACTIVE,
          },
          relations: ['role'],
        });

        if (!membership || !membership.role?.is_organization_owner) {
          // Non-owners cannot have organization-level preferences
          preferenceScope = NotificationPreferenceScope.PERSONAL;
        } else {
          // User is organization owner, use organization_id for query
          queryOrganizationId = organizationId;
        }
      }

      // Try to find existing preference
      const preference = await this.preferenceRepository.findOne({
        where: {
          user_id: userId,
          organization_id: queryOrganizationId, // null for personal, organizationId for organization scope
          scope: preferenceScope,
        },
      });

      if (preference) {
        return {
          email_enabled: preference.email_enabled,
          in_app_enabled: preference.in_app_enabled,
          preferences: preference.preferences || {},
          scope: preference.scope,
        };
      }

      // Return default preferences if not found
      return {
        email_enabled: true,
        in_app_enabled: true,
        preferences: {},
        scope: preferenceScope,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      // Return default preferences on error
      return {
        email_enabled: true,
        in_app_enabled: true,
        preferences: {},
        scope: scope || NotificationPreferenceScope.PERSONAL,
      };
    }
  }

  async updateNotificationPreferences(
    userId: string,
    organizationId: string | null,
    dto: NotificationPreferenceDto,
  ): Promise<{ message: string; preferences: any }> {
    // Determine scope - default to personal if not specified
    const preferenceScope = dto.scope || NotificationPreferenceScope.PERSONAL;

    // If organization scope is requested, verify user is Organization Owner
    if (preferenceScope === NotificationPreferenceScope.ORGANIZATION && organizationId) {
      const membership = await this.memberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role'],
      });

      if (!membership || !membership.role?.is_organization_owner) {
        throw new ForbiddenException(
          'Only Organization Owners can set organization-level notification preferences',
        );
      }
    }

    // Find or create preference
    let preference = await this.preferenceRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        scope: preferenceScope,
      },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        user_id: userId,
        organization_id: organizationId,
        scope: preferenceScope,
        email_enabled: dto.email_enabled !== undefined ? dto.email_enabled : true,
        in_app_enabled: dto.in_app_enabled !== undefined ? dto.in_app_enabled : true,
        preferences: dto.preferences || {},
      });
    } else {
      // Update existing preference - only update fields that are explicitly provided
      if (dto.email_enabled !== undefined) {
        preference.email_enabled = dto.email_enabled;
      }
      if (dto.in_app_enabled !== undefined) {
        preference.in_app_enabled = dto.in_app_enabled;
      }
      if (dto.preferences !== undefined) {
        // Merge preferences instead of replacing
        preference.preferences = {
          ...(preference.preferences || {}),
          ...dto.preferences,
        };
      }
    }

    await this.preferenceRepository.save(preference);

    return {
      message: 'Notification preferences updated successfully',
      preferences: {
        email_enabled: preference.email_enabled,
        in_app_enabled: preference.in_app_enabled,
        preferences: preference.preferences || {},
        scope: preference.scope,
      },
    };
  }
}
