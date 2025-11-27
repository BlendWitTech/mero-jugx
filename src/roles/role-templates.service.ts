import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RoleTemplate } from '../database/entities/role-template.entity';
import { RoleTemplatePermission } from '../database/entities/role-template-permission.entity';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { RolePermission } from '../database/entities/role-permission.entity';
import { Organization } from '../database/entities/organization.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { CreateRoleFromTemplateDto } from './dto/create-role-from-template.dto';

@Injectable()
export class RoleTemplatesService {
  constructor(
    @InjectRepository(RoleTemplate)
    private roleTemplateRepository: Repository<RoleTemplate>,
    @InjectRepository(RoleTemplatePermission)
    private roleTemplatePermissionRepository: Repository<RoleTemplatePermission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {}

  async getRoleTemplates(userId: string, organizationId: string): Promise<RoleTemplate[]> {
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

    // Check permission (roles.create)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'roles.create',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view role templates');
      }
    }

    // Get organization and its package
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // For freemium package, return empty array (they can only use default roles)
    if (organization.package.slug === 'freemium') {
      return [];
    }

    // Get role templates for the organization's package
    const templates = await this.roleTemplateRepository.find({
      where: {
        package_id: organization.package_id,
        is_active: true,
      },
      relations: ['template_permissions', 'template_permissions.permission'],
      order: {
        sort_order: 'ASC',
        name: 'ASC',
      },
    });

    return templates;
  }

  async getRoleTemplateById(
    userId: string,
    organizationId: string,
    templateId: number,
  ): Promise<RoleTemplate> {
    // Verify user is member
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

    // Get organization and verify template belongs to organization's package
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get template
    const template = await this.roleTemplateRepository.findOne({
      where: {
        id: templateId,
        package_id: organization.package_id,
        is_active: true,
      },
      relations: ['template_permissions', 'template_permissions.permission'],
    });

    if (!template) {
      throw new NotFoundException('Role template not found');
    }

    return template;
  }

  async createRoleFromTemplate(
    userId: string,
    organizationId: string,
    dto: CreateRoleFromTemplateDto,
  ): Promise<Role> {
    // Verify user is member and has permission
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

    // Check permission (roles.create)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'roles.create',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to create roles');
      }
    }

    // Get organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Freemium package cannot create roles from templates (only default roles available)
    if (organization.package.slug === 'freemium') {
      throw new BadRequestException(
        'Freemium package can only use default roles (Organization Owner and Admin). Please upgrade your package to create additional roles.',
      );
    }

    // Check role limit - only count custom roles (exclude default roles: owner and admin)
    // Default roles (is_default = true or organization_id = null) don't count against the limit
    const currentCustomRolesCount = await this.roleRepository.count({
      where: {
        organization_id: organizationId,
        is_active: true,
        is_default: false, // Exclude default roles
      },
    });

    if (organization.role_limit !== -1 && currentCustomRolesCount >= organization.role_limit) {
      throw new BadRequestException(
        `Organization role limit reached. You can create up to ${organization.role_limit} custom roles (excluding default roles: Organization Owner and Admin). Please upgrade your package to create more roles.`,
      );
    }

    // Get template
    const template = await this.roleTemplateRepository.findOne({
      where: {
        id: dto.template_id,
        package_id: organization.package_id,
        is_active: true,
      },
      relations: ['template_permissions', 'template_permissions.permission'],
    });

    if (!template) {
      throw new NotFoundException('Role template not found for your package');
    }

    // Check if role with this slug already exists
    const existingRole = await this.roleRepository.findOne({
      where: {
        organization_id: organizationId,
        slug: template.slug,
      },
    });

    if (existingRole) {
      throw new BadRequestException(
        `A role with slug "${template.slug}" already exists. Please use a different template or rename the existing role.`,
      );
    }

    // Validate hierarchy_level if provided
    // Only organization owners and admins can set hierarchy levels
    if (dto.hierarchy_level !== undefined) {
      if (!membership.role.is_organization_owner && membership.role.slug !== 'admin') {
        throw new ForbiddenException('Only organization owners and admins can set role hierarchy levels');
      }
      
      // Hierarchy level must be >= 3 (Owner=1 and Admin=2 are fixed)
      if (dto.hierarchy_level < 3) {
        throw new BadRequestException('Hierarchy level must be 3 or higher. Organization Owner (1) and Admin (2) are fixed and cannot be changed.');
      }
    }

    // Create role from template
    const role = this.roleRepository.create({
      organization_id: organizationId,
      name: template.name,
      hierarchy_level: dto.hierarchy_level || null, // Default to null if not provided (will use default 3 in getRoleHierarchyLevel)
      slug: template.slug,
      description: template.description,
      is_system_role: false,
      is_organization_owner: false,
      is_default: false,
      is_active: true,
    });

    const savedRole = await this.roleRepository.save(role);

    // Get permission IDs for the role
    // If custom_permission_ids is provided, use it completely (full customization)
    // Otherwise, use template permissions + additional permissions
    let allPermissionIds: number[];

    if (dto.custom_permission_ids && dto.custom_permission_ids.length > 0) {
      // Organization wants full control - use only their custom permissions
      allPermissionIds = dto.custom_permission_ids;
    } else {
      // Use template permissions as base and add additional permissions if provided
      const templatePermissionIds = template.template_permissions.map((tp) => tp.permission_id);
      allPermissionIds = [...templatePermissionIds, ...(dto.additional_permission_ids || [])];
    }

    // Remove duplicates
    const uniquePermissionIds = [...new Set(allPermissionIds)];

    // Verify all permissions exist
    const permissions = await this.permissionRepository.find({
      where: uniquePermissionIds.map((id) => ({ id })),
    });

    if (permissions.length !== uniquePermissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Assign permissions to role
    const rolePermissions = uniquePermissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        role_id: savedRole.id,
        permission_id: permissionId,
      }),
    );

    await this.rolePermissionRepository.save(rolePermissions);

    // Return role with permissions
    return this.roleRepository.findOne({
      where: { id: savedRole.id },
      relations: ['role_permissions', 'role_permissions.permission'],
    });
  }
}
