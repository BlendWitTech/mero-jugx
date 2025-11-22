import { Injectable } from '@nestjs/common';
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

export enum NotificationType {
  USER_INVITED = 'user.invited',
  USER_JOINED = 'user.joined',
  USER_REMOVED = 'user.removed',
  ROLE_ASSIGNED = 'role.assigned',
  ROLE_REMOVED = 'role.removed',
  ROLE_CREATED = 'role.created',
  ROLE_UPDATED = 'role.updated',
  INVITATION_ACCEPTED = 'invitation.accepted',
  INVITATION_EXPIRED = 'invitation.expired',
  ORGANIZATION_UPDATED = 'organization.updated',
  PACKAGE_UPGRADED = 'package.upgraded',
  PACKAGE_EXPIRING_SOON = 'package.expiring_soon',
  PACKAGE_EXPIRED = 'package.expired',
  MFA_ENABLED = 'mfa.enabled',
  MFA_DISABLED = 'mfa.disabled',
  SECURITY_ALERT = 'security.alert',
}

export interface NotificationLink {
  route: string; // e.g., '/users', '/roles/123', '/invitations'
  params?: Record<string, any>; // Additional route parameters
}

@Injectable()
export class NotificationHelperService {
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

  /**
   * Important notifications that should always be sent regardless of preferences
   */
  private readonly IMPORTANT_NOTIFICATIONS: NotificationType[] = [
    NotificationType.SECURITY_ALERT,
    NotificationType.MFA_ENABLED,
    NotificationType.MFA_DISABLED,
    NotificationType.USER_REMOVED,
    NotificationType.PACKAGE_UPGRADED,
    NotificationType.PACKAGE_EXPIRING_SOON,
    NotificationType.PACKAGE_EXPIRED,
  ];

  /**
   * Check if a notification type is important (should always be sent)
   */
  private isImportantNotification(type: NotificationType): boolean {
    return this.IMPORTANT_NOTIFICATIONS.includes(type);
  }

  /**
   * Get users by role in an organization
   */
  private async getUsersByRole(
    organizationId: string,
    roleFilter: (role: Role) => boolean,
  ): Promise<OrganizationMember[]> {
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'user'],
    });

    return members.filter((member) => roleFilter(member.role));
  }

  /**
   * Check if user has notification preferences enabled for a specific type
   * Important notifications always return true for in-app, but emails still respect preferences
   *
   * Notification Preferences Structure:
   * - Personal scope with organization_id = null: Global preferences (applies to all organizations)
   * - Personal scope with organization_id = set: Per-organization preferences (current implementation)
   * - Organization scope with organization_id = set: Organization-level settings (only for Organization Owners)
   *
   * Current behavior: Preferences are checked per-organization (organization_id is always set)
   * This allows users to have different notification settings for each organization they belong to.
   */
  private async shouldSendNotification(
    userId: string,
    organizationId: string | null,
    type: NotificationType,
    channel: 'email' | 'in_app',
  ): Promise<boolean> {
    // Important notifications should always be sent for in-app
    // But emails still respect preferences
    const isImportant = this.isImportantNotification(type);
    if (isImportant && channel === 'in_app') {
      return true;
    }

    try {
      // Get user's personal preferences for this organization
      // If organizationId is null, this would check for global preferences
      // Currently, preferences are per-organization (organization_id is always set)
      const preference = await this.preferenceRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId, // Per-organization preferences
          scope: NotificationPreferenceScope.PERSONAL,
        },
      });

      // If no preference found, default to enabled
      if (!preference) {
        return true;
      }

      // Check global email/in_app enabled
      if (channel === 'email' && !preference.email_enabled) {
        return false;
      }
      if (channel === 'in_app' && !preference.in_app_enabled) {
        return false;
      }

      // Check type-specific preferences
      if (preference.preferences) {
        const typeKey = this.getPreferenceKeyForType(type);
        const typePreference = preference.preferences[typeKey];

        if (typePreference) {
          if (channel === 'email' && typePreference.email === false) {
            return false;
          }
          if (channel === 'in_app' && typePreference.in_app === false) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      // If there's an error checking preferences, default to enabled
      console.warn('Error checking notification preferences, defaulting to enabled:', error);
      return true;
    }
  }

  /**
   * Map notification type to preference key
   */
  private getPreferenceKeyForType(type: NotificationType): string {
    const typeMap: Record<NotificationType, string> = {
      [NotificationType.USER_INVITED]: 'user_invitations',
      [NotificationType.USER_JOINED]: 'user_invitations',
      [NotificationType.USER_REMOVED]: 'user_invitations',
      [NotificationType.ROLE_ASSIGNED]: 'role_changes',
      [NotificationType.ROLE_REMOVED]: 'role_changes',
      [NotificationType.ROLE_CREATED]: 'role_changes',
      [NotificationType.ROLE_UPDATED]: 'role_changes',
      [NotificationType.INVITATION_ACCEPTED]: 'user_invitations',
      [NotificationType.INVITATION_EXPIRED]: 'user_invitations',
      [NotificationType.ORGANIZATION_UPDATED]: 'organization_updates',
      [NotificationType.PACKAGE_UPGRADED]: 'organization_updates',
      [NotificationType.PACKAGE_EXPIRING_SOON]: 'organization_updates',
      [NotificationType.PACKAGE_EXPIRED]: 'organization_updates',
      [NotificationType.MFA_ENABLED]: 'security_alerts',
      [NotificationType.MFA_DISABLED]: 'security_alerts',
      [NotificationType.SECURITY_ALERT]: 'security_alerts',
    };
    return typeMap[type] || 'other';
  }

  /**
   * Create a notification with a link to navigate to
   * Only creates in-app notification if user has in_app_enabled for this type
   */
  async createNotification(
    userId: string,
    organizationId: string | null,
    type: NotificationType,
    title: string,
    message: string,
    link?: NotificationLink,
    metadata?: Record<string, any>,
  ): Promise<Notification | null> {
    // Check if in-app notifications are enabled
    const shouldSendInApp = await this.shouldSendNotification(
      userId,
      organizationId,
      type,
      'in_app',
    );

    if (!shouldSendInApp) {
      // Don't create notification if in-app is disabled
      return null;
    }

    const notification = this.notificationRepository.create({
      user_id: userId,
      organization_id: organizationId,
      type,
      title,
      message,
      data: {
        link,
        ...metadata,
      },
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Check if email should be sent for a notification type
   */
  async shouldSendEmail(
    userId: string,
    organizationId: string | null,
    type: NotificationType,
  ): Promise<boolean> {
    return this.shouldSendNotification(userId, organizationId, type, 'email');
  }

  /**
   * Create notification for user invitation
   */
  async notifyUserInvited(
    userId: string,
    organizationId: string,
    invitedUserEmail: string,
    invitationId: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      organizationId,
      NotificationType.USER_INVITED,
      'User Invited',
      `You have been invited to join the organization.`,
      {
        route: '/invitations',
        params: { invitationId },
      },
      {
        invitation_id: invitationId,
        invited_email: invitedUserEmail,
      },
    );
  }

  /**
   * Create notification for user joining
   */
  async notifyUserJoined(
    adminUserId: string,
    organizationId: string,
    newUserEmail: string,
    newUserId: string,
  ): Promise<Notification> {
    return this.createNotification(
      adminUserId,
      organizationId,
      NotificationType.USER_JOINED,
      'New User Joined',
      `${newUserEmail} has joined your organization.`,
      {
        route: '/users',
        params: { userId: newUserId },
      },
      {
        new_user_id: newUserId,
        new_user_email: newUserEmail,
      },
    );
  }

  /**
   * Create notification for role assignment
   */
  async notifyRoleAssigned(
    userId: string,
    organizationId: string,
    roleName: string,
    roleId: number,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      organizationId,
      NotificationType.ROLE_ASSIGNED,
      'Role Assigned',
      `You have been assigned the role: ${roleName}`,
      {
        route: '/roles',
        params: { roleId },
      },
      {
        role_id: roleId,
        role_name: roleName,
      },
    );
  }

  /**
   * Create notification for role removal
   */
  async notifyRoleRemoved(
    userId: string,
    organizationId: string,
    roleName: string,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      organizationId,
      NotificationType.ROLE_REMOVED,
      'Role Removed',
      `Your role "${roleName}" has been removed.`,
      {
        route: '/roles',
      },
      {
        role_name: roleName,
      },
    );
  }

  /**
   * Create notification for invitation acceptance
   */
  async notifyInvitationAccepted(
    adminUserId: string,
    organizationId: string,
    acceptedUserEmail: string,
  ): Promise<Notification> {
    return this.createNotification(
      adminUserId,
      organizationId,
      NotificationType.INVITATION_ACCEPTED,
      'Invitation Accepted',
      `${acceptedUserEmail} has accepted your invitation.`,
      {
        route: '/users',
      },
      {
        accepted_user_email: acceptedUserEmail,
      },
    );
  }

  /**
   * Create notification for organization update
   * Sent to organization owners and admins
   */
  async notifyOrganizationUpdated(
    organizationId: string,
    updateType: string,
  ): Promise<Notification[]> {
    return this.notifyAdminsAndOwners(
      organizationId,
      NotificationType.ORGANIZATION_UPDATED,
      'Organization Updated',
      `Your organization settings have been updated: ${updateType}`,
      {
        route: '/organizations',
      },
      {
        update_type: updateType,
      },
    );
  }

  /**
   * Create notification for package upgrade
   * Sent to all organization users (important notification)
   */
  async notifyPackageUpgraded(
    organizationId: string,
    packageName: string,
    purchasedByUserId?: string,
  ): Promise<Notification[]> {
    // Get all active members of the organization
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    const notifications: Notification[] = [];
    for (const member of members) {
      // Create notification for each user (respects their preferences)
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        NotificationType.PACKAGE_UPGRADED,
        'Package Upgraded',
        purchasedByUserId && purchasedByUserId === member.user_id
          ? `You have successfully upgraded your organization to ${packageName} package.`
          : `Your organization has been upgraded to ${packageName} package.`,
        {
          route: '/packages',
        },
        {
          package_name: packageName,
          purchased_by: purchasedByUserId || null,
        },
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Notify about package expiring soon (1 week before)
   */
  async notifyPackageExpiringSoon(
    organizationId: string,
    packageName: string,
    daysRemaining: number,
  ): Promise<Notification[]> {
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    const notifications: Notification[] = [];
    for (const member of members) {
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        NotificationType.PACKAGE_EXPIRING_SOON,
        'Package Expiring Soon',
        `Your ${packageName} package will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Please renew to continue using premium features.`,
        {
          route: '/packages',
        },
        {
          package_name: packageName,
          days_remaining: daysRemaining,
        },
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Notify about package expired
   */
  async notifyPackageExpired(organizationId: string, packageName: string): Promise<Notification[]> {
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    const notifications: Notification[] = [];
    for (const member of members) {
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        NotificationType.PACKAGE_EXPIRED,
        'Package Expired',
        `Your ${packageName} package has expired. Your organization has been reverted to the Freemium package.`,
        {
          route: '/packages',
        },
        {
          package_name: packageName,
        },
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Create notification for MFA enabled/disabled
   */
  async notifyMFAStatusChanged(
    userId: string,
    organizationId: string,
    enabled: boolean,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      organizationId,
      enabled ? NotificationType.MFA_ENABLED : NotificationType.MFA_DISABLED,
      enabled ? 'MFA Enabled' : 'MFA Disabled',
      enabled
        ? 'Multi-factor authentication has been enabled for your organization.'
        : 'Multi-factor authentication has been disabled for your organization.',
      {
        route: '/settings',
        params: { tab: 'security' },
      },
      {
        mfa_enabled: enabled,
      },
    );
  }

  /**
   * Create notification for security alert
   * Security alerts are important and sent to all active users in the organization
   */
  async notifySecurityAlert(
    userId: string,
    organizationId: string,
    message: string,
    link?: NotificationLink,
  ): Promise<Notification[]> {
    // Security alerts should be sent to all active users
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    const notifications: Notification[] = [];
    for (const member of members) {
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        NotificationType.SECURITY_ALERT,
        'Security Alert',
        message,
        link,
        {
          alert_type: 'security',
        },
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Send notification to organization owners
   */
  async notifyOrganizationOwners(
    organizationId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: NotificationLink,
    metadata?: Record<string, any>,
  ): Promise<Notification[]> {
    const owners = await this.getUsersByRole(
      organizationId,
      (role) => role.is_organization_owner === true,
    );

    const notifications: Notification[] = [];
    for (const owner of owners) {
      const notification = await this.createNotification(
        owner.user_id,
        organizationId,
        type,
        title,
        message,
        link,
        metadata,
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Send notification to admins and owners
   */
  async notifyAdminsAndOwners(
    organizationId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: NotificationLink,
    metadata?: Record<string, any>,
  ): Promise<Notification[]> {
    const adminsAndOwners = await this.getUsersByRole(
      organizationId,
      (role) => role.is_organization_owner === true || role.slug === 'admin',
    );

    const notifications: Notification[] = [];
    for (const member of adminsAndOwners) {
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        type,
        title,
        message,
        link,
        metadata,
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Send notification to users with specific permission
   */
  async notifyUsersWithPermission(
    organizationId: string,
    permissionSlug: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: NotificationLink,
    metadata?: Record<string, any>,
  ): Promise<Notification[]> {
    // Get all active members with their roles and permissions
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    // Filter members who have the required permission or are organization owners
    const eligibleMembers = members.filter((member) => {
      if (member.role.is_organization_owner) {
        return true; // Owners have all permissions
      }
      return member.role.role_permissions?.some((rp) => rp.permission.slug === permissionSlug);
    });

    const notifications: Notification[] = [];
    for (const member of eligibleMembers) {
      const notification = await this.createNotification(
        member.user_id,
        organizationId,
        type,
        title,
        message,
        link,
        metadata,
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }
}
