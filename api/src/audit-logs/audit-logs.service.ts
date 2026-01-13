import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AuditLog } from '../database/entities/audit_logs.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { User } from '../database/entities/users.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Determine role hierarchy level
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
    // For custom/organization-specific roles, use hierarchy_level if set, otherwise default to 3
    // hierarchy_level must be >= 3 (cannot override Owner=1 or Admin=2)
    if (role.hierarchy_level !== null && role.hierarchy_level !== undefined && role.hierarchy_level >= 3) {
      return role.hierarchy_level;
    }
    // Default to 3 if not set
    return 3;
  }

  /**
   * Get role IDs that the requesting user can view logs for
   * - Organization Owner: Can see all roles (including their own)
   * - Admin: Can see junior roles and their own, but not Organization Owner or other Admins
   * - Other roles: Can see only junior roles and their own
   */
  private async getViewableRoleIds(
    requestingUserId: string,
    organizationId: string,
    requestingUserRole: Role,
  ): Promise<number[]> {
    // Organization Owner can see all roles
    if (requestingUserRole.is_organization_owner) {
      const allRoles = await this.roleRepository.find({
        where: [
          { organization_id: organizationId, is_active: true },
          { organization_id: null, is_default: true, is_active: true },
        ],
      });
      return allRoles.map((r) => r.id);
    }

    const requestingRoleLevel = this.getRoleHierarchyLevel(requestingUserRole);
    const viewableRoleIds: number[] = [requestingUserRole.id]; // Always include own role

    // Get all roles in the organization
    const allRoles = await this.roleRepository.find({
      where: [
        { organization_id: organizationId, is_active: true },
        { organization_id: null, is_default: true, is_active: true },
      ],
    });

    // Filter to only include junior roles (higher level number = lower in hierarchy)
    for (const role of allRoles) {
      const roleLevel = this.getRoleHierarchyLevel(role);
      // Can view roles that are lower in hierarchy (higher level number)
      // Cannot view roles at same level or higher level
      if (roleLevel > requestingRoleLevel) {
        viewableRoleIds.push(role.id);
      }
    }

    return viewableRoleIds;
  }

  /**
   * Get user IDs that the requesting user can view logs for
   */
  private async getViewableUserIds(
    requestingUserId: string,
    organizationId: string,
    requestingUserRole: Role,
    viewableRoleIds: number[],
  ): Promise<string[]> {
    // Organization Owner can see all users
    if (requestingUserRole.is_organization_owner) {
      const allMembers = await this.memberRepository.find({
        where: {
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
      });
      return allMembers.map((m) => m.user_id);
    }

    // Get all members with viewable roles
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        role_id: In(viewableRoleIds),
      },
    });

    // Always include requesting user's own ID
    const viewableUserIds = [requestingUserId, ...members.map((m) => m.user_id)];

    // Remove duplicates
    return [...new Set(viewableUserIds)];
  }

  async getAuditLogs(
    userId: string,
    organizationId: string,
    query: AuditLogQueryDto,
  ): Promise<{
    audit_logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
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

      if (!membership.role) {
        throw new ForbiddenException('Your role information is missing. Please contact support.');
      }

      // Check permission (audit.view)
      if (!membership.role.is_organization_owner) {
        const roleWithPermissions = await this.roleRepository.findOne({
          where: { id: membership.role_id },
          relations: ['role_permissions', 'role_permissions.permission'],
        });

        const hasPermission = roleWithPermissions?.role_permissions?.some(
          (rp) => rp.permission.slug === 'audit.view',
        );

        if (!hasPermission) {
          throw new ForbiddenException('You do not have permission to view audit logs');
        }
      }

      // Get viewable role IDs based on role hierarchy
      const viewableRoleIds = await this.getViewableRoleIds(
        userId,
        organizationId,
        membership.role,
      );

      // Get viewable user IDs (users with viewable roles + requesting user)
      const viewableUserIds = await this.getViewableUserIds(
        userId,
        organizationId,
        membership.role,
        viewableRoleIds,
      );

      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      // Build query - filter by viewable users
      const queryBuilder = this.auditLogRepository
        .createQueryBuilder('audit_log')
        .leftJoinAndSelect('audit_log.user', 'user')
        .where('audit_log.organization_id = :organizationId', { organizationId });

      // Handle empty viewableUserIds array (shouldn't happen, but handle gracefully)
      if (viewableUserIds.length === 0) {
        // If no viewable users, only show logs with null user_id (system logs)
        queryBuilder.andWhere('audit_log.user_id IS NULL');
      } else {
        queryBuilder.andWhere(
          '(audit_log.user_id IN (:...viewableUserIds) OR audit_log.user_id IS NULL)',
          {
            viewableUserIds,
          },
        );
      }

      // Apply search filter (searches in action, entity_type, user name/email)
      if (query.search) {
        queryBuilder.andWhere(
          '(audit_log.action ILIKE :search OR audit_log.entity_type ILIKE :search OR CAST(audit_log.entity_id AS TEXT) ILIKE :search OR (user.first_name IS NOT NULL AND user.first_name ILIKE :search) OR (user.last_name IS NOT NULL AND user.last_name ILIKE :search) OR (user.email IS NOT NULL AND user.email ILIKE :search))',
          { search: `%${query.search}%` },
        );
      }

      // Apply filters
      if (query.action) {
        queryBuilder.andWhere('audit_log.action = :action', { action: query.action });
      }

      if (query.entity_type) {
        queryBuilder.andWhere('audit_log.entity_type = :entityType', {
          entityType: query.entity_type,
        });
      }

      if (query.entity_id) {
        queryBuilder.andWhere('audit_log.entity_id = :entityId', {
          entityId: query.entity_id,
        });
      }

      // If user_id filter is provided, ensure it's in viewable users
      if (query.user_id) {
        if (!viewableUserIds.includes(query.user_id)) {
          throw new ForbiddenException(
            'You do not have permission to view audit logs for this user',
          );
        }
        queryBuilder.andWhere('audit_log.user_id = :userId', { userId: query.user_id });
      }

      if (query.from_date && query.to_date) {
        queryBuilder.andWhere('audit_log.created_at BETWEEN :fromDate AND :toDate', {
          fromDate: query.from_date,
          toDate: query.to_date,
        });
      } else if (query.from_date) {
        queryBuilder.andWhere('audit_log.created_at >= :fromDate', {
          fromDate: query.from_date,
        });
      } else       if (query.to_date) {
        queryBuilder.andWhere('audit_log.created_at <= :toDate', {
          toDate: query.to_date,
        });
      }

      // Filter by severity
      if (query.severity) {
        queryBuilder.andWhere('audit_log.severity = :severity', {
          severity: query.severity,
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      const auditLogs = await queryBuilder
        .orderBy('audit_log.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      return {
        audit_logs: auditLogs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      // Log error for debugging
      console.error('Error in getAuditLogs:', error);
      // Re-throw known exceptions
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to fetch audit logs: ${error?.message || 'Unknown error'}`);
    }
  }

  async getAuditLogById(
    userId: string,
    organizationId: string,
    auditLogId: number,
  ): Promise<AuditLog> {
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

    // Check permission (audit.view)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'audit.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view audit logs');
      }
    }

    const auditLog = await this.auditLogRepository.findOne({
      where: {
        id: auditLogId,
        organization_id: organizationId,
      },
      relations: ['user', 'organization'],
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    // Check if user can view this specific audit log
    if (auditLog.user_id) {
      const viewableRoleIds = await this.getViewableRoleIds(
        userId,
        organizationId,
        membership.role,
      );
      const viewableUserIds = await this.getViewableUserIds(
        userId,
        organizationId,
        membership.role,
        viewableRoleIds,
      );

      if (!viewableUserIds.includes(auditLog.user_id)) {
        throw new ForbiddenException('You do not have permission to view this audit log');
      }
    }

    return auditLog;
  }

  async getAuditLogStats(
    userId: string,
    organizationId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{
    total_actions: number;
    actions_by_type: Record<string, number>;
    actions_by_user: Array<{ user_id: string; user_name: string; count: number }>;
    recent_actions: AuditLog[];
    total_logs: number;
    unique_users: number;
    actions_today: number;
    actions_this_week: number;
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

    // Check permission (audit.view)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'audit.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view audit logs');
      }
    }

    // Get viewable role IDs and user IDs
    const viewableRoleIds = await this.getViewableRoleIds(userId, organizationId, membership.role);
    const viewableUserIds = await this.getViewableUserIds(
      userId,
      organizationId,
      membership.role,
      viewableRoleIds,
    );

    // Build base query - filter by viewable users
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .where('audit_log.organization_id = :organizationId', { organizationId });

    // Handle empty viewableUserIds array
    if (viewableUserIds.length === 0) {
      queryBuilder.andWhere('audit_log.user_id IS NULL');
    } else {
      queryBuilder.andWhere(
        '(audit_log.user_id IN (:...viewableUserIds) OR audit_log.user_id IS NULL)',
        {
          viewableUserIds,
        },
      );
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere('audit_log.created_at BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    // Get total actions
    const totalActions = await queryBuilder.getCount();

    // Get actions by type (filtered by viewable users)
    const actionsByTypeQuery = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.organization_id = :organizationId', { organizationId });

    if (viewableUserIds.length === 0) {
      actionsByTypeQuery.andWhere('audit_log.user_id IS NULL');
    } else {
      actionsByTypeQuery.andWhere(
        '(audit_log.user_id IN (:...viewableUserIds) OR audit_log.user_id IS NULL)',
        {
          viewableUserIds,
        },
      );
    }

    const actionsByType = await actionsByTypeQuery.groupBy('audit_log.action').getRawMany();

    const actionsByTypeMap: Record<string, number> = {};
    actionsByType.forEach((item) => {
      actionsByTypeMap[item.action] = parseInt(item.count, 10);
    });

    // Get actions by user (filtered by viewable users)
    const actionsByUserQuery = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoin('audit_log.user', 'user')
      .select('audit_log.user_id', 'user_id')
      .addSelect("CONCAT(user.first_name, ' ', user.last_name)", 'user_name')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.organization_id = :organizationId', { organizationId })
      .andWhere('audit_log.user_id IS NOT NULL');

    if (viewableUserIds.length > 0) {
      actionsByUserQuery.andWhere('audit_log.user_id IN (:...viewableUserIds)', {
        viewableUserIds,
      });
    } else {
      // If no viewable users, return empty array (no user-specific logs)
      actionsByUserQuery.andWhere('1 = 0'); // Always false condition
    }

    const actionsByUser = await actionsByUserQuery
      .groupBy('audit_log.user_id')
      .addGroupBy('user.first_name')
      .addGroupBy('user.last_name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Get recent actions
    const recentActions = await queryBuilder
      .orderBy('audit_log.created_at', 'DESC')
      .limit(10)
      .getMany();

    // Calculate unique users count
    const uniqueUsers = new Set(actionsByUser.map((item) => item.user_id)).size;

    // Calculate actions today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const actionsTodayQuery = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.organization_id = :organizationId', { organizationId })
      .andWhere('audit_log.created_at >= :todayStart', { todayStart })
      .andWhere('audit_log.created_at <= :todayEnd', { todayEnd });

    if (viewableUserIds.length === 0) {
      actionsTodayQuery.andWhere('audit_log.user_id IS NULL');
    } else {
      actionsTodayQuery.andWhere(
        '(audit_log.user_id IN (:...viewableUserIds) OR audit_log.user_id IS NULL)',
        {
          viewableUserIds,
        },
      );
    }

    const actionsToday = await actionsTodayQuery.getCount();

    // Calculate actions this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setHours(23, 59, 59, 999);

    const actionsThisWeekQuery = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.organization_id = :organizationId', { organizationId })
      .andWhere('audit_log.created_at >= :weekStart', { weekStart })
      .andWhere('audit_log.created_at <= :weekEnd', { weekEnd });

    if (viewableUserIds.length === 0) {
      actionsThisWeekQuery.andWhere('audit_log.user_id IS NULL');
    } else {
      actionsThisWeekQuery.andWhere(
        '(audit_log.user_id IN (:...viewableUserIds) OR audit_log.user_id IS NULL)',
        {
          viewableUserIds,
        },
      );
    }

    const actionsThisWeek = await actionsThisWeekQuery.getCount();

    return {
      total_actions: totalActions,
      actions_by_type: actionsByTypeMap,
      actions_by_user: actionsByUser.map((item) => ({
        user_id: item.user_id,
        user_name: item.user_name || 'Unknown',
        count: parseInt(item.count, 10),
      })),
      recent_actions: recentActions,
      total_logs: totalActions,
      unique_users: uniqueUsers,
      actions_today: actionsToday,
      actions_this_week: actionsThisWeek,
    };
  }

  async createAuditLog(
    organizationId: string | null,
    userId: string | null,
    action: string,
    entityType: string | null,
    entityId: string | null,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
    severity: 'critical' | 'warning' | 'info' = 'info',
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      organization_id: organizationId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata,
      severity,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Get users that the requesting user can view audit logs for
   */
  async getViewableUsers(
    userId: string,
    organizationId: string,
  ): Promise<Array<{ id: string; first_name: string; last_name: string; email: string }>> {
    try {
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

      if (!membership.role) {
        throw new ForbiddenException('Your role information is missing. Please contact support.');
      }

      // Get viewable role IDs based on role hierarchy
      const viewableRoleIds = await this.getViewableRoleIds(
        userId,
        organizationId,
        membership.role,
      );

      // Get viewable user IDs (users with viewable roles + requesting user)
      const viewableUserIds = await this.getViewableUserIds(
        userId,
        organizationId,
        membership.role,
        viewableRoleIds,
      );

      if (viewableUserIds.length === 0) {
        return [];
      }

      // Get user details for viewable users
      const users = await this.userRepository.find({
        where: {
          id: In(viewableUserIds),
        },
        select: ['id', 'first_name', 'last_name', 'email'],
      });

      return users;
    } catch (error: any) {
      console.error('Error in getViewableUsers:', error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Failed to fetch viewable users: ${error?.message || 'Unknown error'}`);
    }
  }
}
