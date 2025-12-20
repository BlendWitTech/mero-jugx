import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../../database/entities/organization_members.entity';
import { Role } from '../../database/entities/roles.entity';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => AuditLogsService))
    private auditLogsService: AuditLogsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId || !user.organizationId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's membership and role
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: user.userId,
        organization_id: user.organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Organization owner has all permissions
    if (membership.role.is_organization_owner) {
      return true;
    }

    // Get role with permissions
    const roleWithPermissions = await this.roleRepository.findOne({
      where: { id: membership.role_id },
      relations: ['role_permissions', 'role_permissions.permission'],
    });

    if (!roleWithPermissions) {
      throw new ForbiddenException('Role not found');
    }

    // Extract permission slugs
    const userPermissions = roleWithPermissions.role_permissions.map((rp) => rp.permission.slug);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      // Log unauthorized access attempt as critical severity
      const request = context.switchToHttp().getRequest();
      try {
        await this.auditLogsService.createAuditLog(
          user.organizationId,
          user.userId,
          'unauthorized_access_attempt',
          'permission',
          requiredPermissions.join(','),
          null,
          {
            requested_permissions: requiredPermissions,
            user_permissions: userPermissions,
            endpoint: request.url,
            method: request.method,
          },
          request.ip,
          request.headers['user-agent'],
          {
            missing_permissions: requiredPermissions.filter(p => !userPermissions.includes(p)),
          },
          'critical', // Critical severity for unauthorized access
        );
      } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('Failed to log unauthorized access attempt:', error);
      }

      throw new ForbiddenException(
        `You do not have the required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
