import { DataSource } from 'typeorm';
import { Package } from '../entities/package.entity';
import { RoleTemplate } from '../entities/role-template.entity';
import { RoleTemplatePermission } from '../entities/role-template-permission.entity';
import { Permission } from '../entities/permission.entity';

export async function seedRoleTemplates(dataSource: DataSource): Promise<void> {
  const packageRepository = dataSource.getRepository(Package);
  const templateRepository = dataSource.getRepository(RoleTemplate);
  const templatePermissionRepository = dataSource.getRepository(RoleTemplatePermission);
  const permissionRepository = dataSource.getRepository(Permission);

  // Get all packages
  const freemium = await packageRepository.findOne({ where: { slug: 'freemium' } });
  const basic = await packageRepository.findOne({ where: { slug: 'basic' } });
  const platinum = await packageRepository.findOne({ where: { slug: 'platinum' } });
  const diamond = await packageRepository.findOne({ where: { slug: 'diamond' } });

  // Get all permissions
  const allPermissions = await permissionRepository.find();
  const permissionsMap = new Map(allPermissions.map((p) => [p.slug, p]));

  // Helper function to get permission IDs by slugs
  const getPermissionIds = (slugs: string[]): number[] => {
    return slugs
      .map((slug) => permissionsMap.get(slug)?.id)
      .filter((id): id is number => id !== undefined);
  };

  // Role Templates for Basic Package
  if (basic) {
    const basicTemplates = [
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Manages team members and has access to user and role management',
        sort_order: 1,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.assign',
          'organizations.view',
          'packages.view',
          'invitations.create',
          'invitations.view',
        ],
      },
      {
        name: 'Employee',
        slug: 'employee',
        description: 'Standard employee with basic access to organization features',
        sort_order: 2,
        permissions: [
          'users.view',
          'organizations.view',
          'packages.view',
        ],
      },
      {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access to most organization information',
        sort_order: 3,
        permissions: [
          'users.view',
          'roles.view',
          'organizations.view',
          'packages.view',
        ],
      },
    ];

    for (const templateData of basicTemplates) {
      let template = await templateRepository.findOne({
        where: { package_id: basic.id, slug: templateData.slug },
      });

      if (!template) {
        template = templateRepository.create({
          package_id: basic.id,
          name: templateData.name,
          slug: templateData.slug,
          description: templateData.description,
          sort_order: templateData.sort_order,
          is_active: true,
        });
        template = await templateRepository.save(template);
        console.log(`✓ Created template: ${templateData.name} for Basic package`);
      } else {
        console.log(`- Template already exists: ${templateData.name} for Basic package`);
      }

      // Assign permissions to template
      const permissionIds = getPermissionIds(templateData.permissions);
      
      // Remove existing permissions
      await templatePermissionRepository.delete({ role_template_id: template.id });
      
      // Add new permissions
      if (permissionIds.length > 0) {
        const templatePermissions = permissionIds.map((permissionId) =>
          templatePermissionRepository.create({
            role_template_id: template.id,
            permission_id: permissionId,
          }),
        );
        await templatePermissionRepository.save(templatePermissions);
        console.log(`  → Assigned ${permissionIds.length} permissions`);
      }
    }
  }

  // Role Templates for Platinum Package (includes Basic templates + more)
  if (platinum) {
    const platinumTemplates = [
      {
        name: 'Senior Manager',
        slug: 'senior-manager',
        description: 'Senior manager with extended permissions including role management',
        sort_order: 1,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.create',
          'roles.edit',
          'roles.assign',
          'organizations.view',
          'organizations.edit',
          'packages.view',
          'invitations.create',
          'invitations.view',
          'invitations.cancel',
        ],
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Manages team members and has access to user and role management',
        sort_order: 2,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.assign',
          'organizations.view',
          'packages.view',
          'invitations.create',
          'invitations.view',
        ],
      },
      {
        name: 'Team Lead',
        slug: 'team-lead',
        description: 'Team lead with permissions to manage team members',
        sort_order: 3,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.assign',
          'organizations.view',
          'invitations.create',
          'invitations.view',
        ],
      },
      {
        name: 'Employee',
        slug: 'employee',
        description: 'Standard employee with basic access to organization features',
        sort_order: 4,
        permissions: [
          'users.view',
          'organizations.view',
          'packages.view',
        ],
      },
      {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access to most organization information',
        sort_order: 5,
        permissions: [
          'users.view',
          'roles.view',
          'organizations.view',
          'packages.view',
        ],
      },
    ];

    for (const templateData of platinumTemplates) {
      let template = await templateRepository.findOne({
        where: { package_id: platinum.id, slug: templateData.slug },
      });

      if (!template) {
        template = templateRepository.create({
          package_id: platinum.id,
          name: templateData.name,
          slug: templateData.slug,
          description: templateData.description,
          sort_order: templateData.sort_order,
          is_active: true,
        });
        template = await templateRepository.save(template);
        console.log(`✓ Created template: ${templateData.name} for Platinum package`);
      } else {
        console.log(`- Template already exists: ${templateData.name} for Platinum package`);
      }

      // Assign permissions to template
      const permissionIds = getPermissionIds(templateData.permissions);
      
      // Remove existing permissions
      await templatePermissionRepository.delete({ role_template_id: template.id });
      
      // Add new permissions
      if (permissionIds.length > 0) {
        const templatePermissions = permissionIds.map((permissionId) =>
          templatePermissionRepository.create({
            role_template_id: template.id,
            permission_id: permissionId,
          }),
        );
        await templatePermissionRepository.save(templatePermissions);
        console.log(`  → Assigned ${permissionIds.length} permissions`);
      }
    }
  }

  // Role Templates for Diamond Package (includes all templates + advanced)
  if (diamond) {
    const diamondTemplates = [
      {
        name: 'Executive',
        slug: 'executive',
        description: 'Executive role with full access except package management',
        sort_order: 1,
        permissions: [
          'users.view',
          'users.edit',
          'users.revoke',
          'roles.view',
          'roles.create',
          'roles.edit',
          'roles.delete',
          'roles.assign',
          'organizations.view',
          'organizations.edit',
          'organizations.settings',
          'packages.view',
          'packages.features.purchase',
          'packages.features.cancel',
          'invitations.create',
          'invitations.view',
          'invitations.cancel',
          'audit.view',
        ],
      },
      {
        name: 'Senior Manager',
        slug: 'senior-manager',
        description: 'Senior manager with extended permissions including role management',
        sort_order: 2,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.create',
          'roles.edit',
          'roles.assign',
          'organizations.view',
          'organizations.edit',
          'packages.view',
          'invitations.create',
          'invitations.view',
          'invitations.cancel',
        ],
      },
      {
        name: 'Manager',
        slug: 'manager',
        description: 'Manages team members and has access to user and role management',
        sort_order: 3,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.assign',
          'organizations.view',
          'packages.view',
          'invitations.create',
          'invitations.view',
        ],
      },
      {
        name: 'Team Lead',
        slug: 'team-lead',
        description: 'Team lead with permissions to manage team members',
        sort_order: 4,
        permissions: [
          'users.view',
          'users.edit',
          'roles.view',
          'roles.assign',
          'organizations.view',
          'invitations.create',
          'invitations.view',
        ],
      },
      {
        name: 'Employee',
        slug: 'employee',
        description: 'Standard employee with basic access to organization features',
        sort_order: 5,
        permissions: [
          'users.view',
          'organizations.view',
          'packages.view',
        ],
      },
      {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access to most organization information',
        sort_order: 6,
        permissions: [
          'users.view',
          'roles.view',
          'organizations.view',
          'packages.view',
        ],
      },
    ];

    for (const templateData of diamondTemplates) {
      let template = await templateRepository.findOne({
        where: { package_id: diamond.id, slug: templateData.slug },
      });

      if (!template) {
        template = templateRepository.create({
          package_id: diamond.id,
          name: templateData.name,
          slug: templateData.slug,
          description: templateData.description,
          sort_order: templateData.sort_order,
          is_active: true,
        });
        template = await templateRepository.save(template);
        console.log(`✓ Created template: ${templateData.name} for Diamond package`);
      } else {
        console.log(`- Template already exists: ${templateData.name} for Diamond package`);
      }

      // Assign permissions to template
      const permissionIds = getPermissionIds(templateData.permissions);
      
      // Remove existing permissions
      await templatePermissionRepository.delete({ role_template_id: template.id });
      
      // Add new permissions
      if (permissionIds.length > 0) {
        const templatePermissions = permissionIds.map((permissionId) =>
          templatePermissionRepository.create({
            role_template_id: template.id,
            permission_id: permissionId,
          }),
        );
        await templatePermissionRepository.save(templatePermissions);
        console.log(`  → Assigned ${permissionIds.length} permissions`);
      }
    }
  }

  console.log('✓ Role templates seeding completed');
}

