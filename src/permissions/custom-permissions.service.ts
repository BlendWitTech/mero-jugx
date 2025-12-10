import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomPermission } from '../database/entities/custom-permission.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CustomPermissionsService {
  constructor(
    @InjectRepository(CustomPermission)
    private customPermissionRepository: Repository<CustomPermission>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a custom permission
   */
  async createCustomPermission(
    organizationId: string,
    userId: string,
    name: string,
    slug: string,
    description: string | null,
    category: string,
  ): Promise<CustomPermission> {
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
      throw new ForbiddenException('You do not have permission to create custom permissions');
    }

    // Check if slug already exists for this organization
    const existing = await this.customPermissionRepository.findOne({
      where: {
        organization_id: organizationId,
        slug: slug.toLowerCase(),
      },
    });

    if (existing) {
      throw new ConflictException('A custom permission with this slug already exists');
    }

    const permission = this.customPermissionRepository.create({
      organization_id: organizationId,
      created_by: userId,
      name,
      slug: slug.toLowerCase(),
      description,
      category,
      is_active: true,
    });

    const saved = await this.customPermissionRepository.save(permission);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'custom_permission.created',
      'custom_permission',
      String(saved.id),
      null,
      { name, slug, category },
    );

    return saved;
  }

  /**
   * List custom permissions for organization
   */
  async listCustomPermissions(organizationId: string, userId: string): Promise<CustomPermission[]> {
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
      throw new ForbiddenException('You do not have permission to view custom permissions');
    }

    return this.customPermissionRepository.find({
      where: {
        organization_id: organizationId,
        is_active: true,
      },
      relations: ['creator'],
      order: {
        category: 'ASC',
        name: 'ASC',
      },
    });
  }

  /**
   * Update custom permission
   */
  async updateCustomPermission(
    organizationId: string,
    userId: string,
    permissionId: number,
    updates: {
      name?: string;
      description?: string | null;
      category?: string;
      is_active?: boolean;
    },
  ): Promise<CustomPermission> {
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
      throw new ForbiddenException('You do not have permission to update custom permissions');
    }

    const permission = await this.customPermissionRepository.findOne({
      where: {
        id: permissionId,
        organization_id: organizationId,
      },
    });

    if (!permission) {
      throw new NotFoundException('Custom permission not found');
    }

    const oldValues = {
      name: permission.name,
      description: permission.description,
      category: permission.category,
      is_active: permission.is_active,
    };

    if (updates.name !== undefined) permission.name = updates.name;
    if (updates.description !== undefined) permission.description = updates.description;
    if (updates.category !== undefined) permission.category = updates.category;
    if (updates.is_active !== undefined) permission.is_active = updates.is_active;

    const saved = await this.customPermissionRepository.save(permission);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'custom_permission.updated',
      'custom_permission',
      String(permissionId),
      oldValues,
      {
        name: saved.name,
        description: saved.description,
        category: saved.category,
        is_active: saved.is_active,
      },
    );

    return saved;
  }

  /**
   * Delete custom permission
   */
  async deleteCustomPermission(
    organizationId: string,
    userId: string,
    permissionId: number,
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
      throw new ForbiddenException('You do not have permission to delete custom permissions');
    }

    const permission = await this.customPermissionRepository.findOne({
      where: {
        id: permissionId,
        organization_id: organizationId,
      },
    });

    if (!permission) {
      throw new NotFoundException('Custom permission not found');
    }

    // Soft delete by setting is_active to false
    permission.is_active = false;
    await this.customPermissionRepository.save(permission);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'custom_permission.deleted',
      'custom_permission',
      String(permissionId),
      null,
      null,
    );
  }
}

