import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { TimeBasedPermission } from '../database/entities/time-based-permission.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class TimeBasedPermissionsService {
  constructor(
    @InjectRepository(TimeBasedPermission)
    private timeBasedPermissionRepository: Repository<TimeBasedPermission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Grant a time-based permission to a role
   */
  async grantTimeBasedPermission(
    organizationId: string,
    userId: string,
    roleId: number,
    permissionId: number,
    startsAt: Date,
    expiresAt: Date,
    reason: string | null,
  ): Promise<TimeBasedPermission> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'roles.manage');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to grant time-based permissions');
    }

    // Verify role belongs to organization
    const role = await this.roleRepository.findOne({
      where: {
        id: roleId,
        organization_id: organizationId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Validate dates
    if (startsAt >= expiresAt) {
      throw new BadRequestException('Start date must be before expiration date');
    }

    if (startsAt < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check for overlapping permissions
    const overlapping = await this.timeBasedPermissionRepository.findOne({
      where: {
        role_id: roleId,
        permission_id: permissionId,
        is_active: true,
        starts_at: LessThan(expiresAt),
        expires_at: MoreThan(startsAt),
      },
    });

    if (overlapping) {
      throw new ConflictException('A time-based permission for this role and permission already exists in this time range');
    }

    const timeBasedPermission = this.timeBasedPermissionRepository.create({
      role_id: roleId,
      permission_id: permissionId,
      starts_at: startsAt,
      expires_at: expiresAt,
      is_active: true,
      granted_by: userId,
      reason,
    });

    const saved = await this.timeBasedPermissionRepository.save(timeBasedPermission);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'time_based_permission.granted',
      'time_based_permission',
      String(saved.id),
      null,
      { role_id: roleId, permission_id: permissionId, starts_at: startsAt, expires_at: expiresAt },
    );

    return saved;
  }

  /**
   * List time-based permissions for a role
   */
  async listTimeBasedPermissions(
    organizationId: string,
    userId: string,
    roleId?: number,
  ): Promise<TimeBasedPermission[]> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'roles.view');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view time-based permissions');
    }

    const queryBuilder = this.timeBasedPermissionRepository
      .createQueryBuilder('tbp')
      .innerJoin('tbp.role', 'role')
      .where('role.organization_id = :orgId', { orgId: organizationId })
      .leftJoinAndSelect('tbp.permission', 'permission')
      .leftJoinAndSelect('tbp.granter', 'granter');

    if (roleId) {
      queryBuilder.andWhere('tbp.role_id = :roleId', { roleId });
    }

    return queryBuilder
      .orderBy('tbp.starts_at', 'ASC')
      .getMany();
  }

  /**
   * Revoke a time-based permission
   */
  async revokeTimeBasedPermission(
    organizationId: string,
    userId: string,
    timeBasedPermissionId: number,
  ): Promise<void> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'roles.manage');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to revoke time-based permissions');
    }

    const timeBasedPermission = await this.timeBasedPermissionRepository.findOne({
      where: { id: timeBasedPermissionId },
      relations: ['role'],
    });

    if (!timeBasedPermission) {
      throw new NotFoundException('Time-based permission not found');
    }

    if (timeBasedPermission.role.organization_id !== organizationId) {
      throw new ForbiddenException('Time-based permission does not belong to this organization');
    }

    timeBasedPermission.is_active = false;
    await this.timeBasedPermissionRepository.save(timeBasedPermission);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'time_based_permission.revoked',
      'time_based_permission',
      String(timeBasedPermissionId),
      null,
      null,
    );
  }

  /**
   * Check and deactivate expired permissions (should be called by a scheduled task)
   */
  async deactivateExpiredPermissions(): Promise<number> {
    const now = new Date();
    const expired = await this.timeBasedPermissionRepository.find({
      where: {
        is_active: true,
        expires_at: LessThan(now),
      },
    });

    if (expired.length > 0) {
      expired.forEach(p => {
        p.is_active = false;
      });
      await this.timeBasedPermissionRepository.save(expired);
    }

    return expired.length;
  }

  /**
   * Get active time-based permissions for a role
   */
  async getActiveTimeBasedPermissions(roleId: number): Promise<TimeBasedPermission[]> {
    const now = new Date();
    return this.timeBasedPermissionRepository.find({
      where: {
        role_id: roleId,
        is_active: true,
        starts_at: LessThan(now),
        expires_at: MoreThan(now),
      },
      relations: ['permission'],
    });
  }
}

