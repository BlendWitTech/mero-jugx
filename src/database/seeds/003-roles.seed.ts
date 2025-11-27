import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  // Create Organization Owner role (system role)
  const ownerRole = await roleRepository.findOne({
    where: { slug: 'organization-owner', is_system_role: true },
  });

  if (!ownerRole) {
    const newOwnerRole = roleRepository.create({
      name: 'Organization Owner',
      slug: 'organization-owner',
      description: 'Organization owner with all permissions',
      is_system_role: true,
      is_organization_owner: true,
      is_default: true,
      is_active: true,
      organization_id: null,
    });
    await roleRepository.save(newOwnerRole);
    console.log('✓ Seeded role: Organization Owner');

    // Assign all permissions to Organization Owner
    const allPermissions = await permissionRepository.find();
    for (const permission of allPermissions) {
      await rolePermissionRepository.save(
        rolePermissionRepository.create({
          role_id: newOwnerRole.id,
          permission_id: permission.id,
        }),
      );
    }
    console.log(`✓ Assigned ${allPermissions.length} permissions to Organization Owner`);
  } else {
    console.log('- Organization Owner role already exists');
  }

  // Create Admin role (system role)
  const adminRole = await roleRepository.findOne({
    where: { slug: 'admin', is_system_role: true },
  });

  if (!adminRole) {
    const newAdminRole = roleRepository.create({
      name: 'Admin',
      slug: 'admin',
      description: 'Administrator with most permissions',
      is_system_role: true,
      is_organization_owner: false,
      is_default: true,
      is_active: true,
      organization_id: null,
    });
    await roleRepository.save(newAdminRole);
    console.log('✓ Seeded role: Admin');

    // Assign permissions to Admin (all except package upgrade/purchase, but including all chat permissions)
    const adminPermissions = await permissionRepository.find({
      where: [
        { slug: 'users.view' },
        { slug: 'users.edit' },
        { slug: 'users.delete' },
        { slug: 'users.revoke' },
        { slug: 'roles.view' },
        { slug: 'roles.create' },
        { slug: 'roles.edit' },
        { slug: 'roles.delete' },
        { slug: 'roles.assign' },
        { slug: 'organizations.view' },
        { slug: 'organizations.edit' },
        { slug: 'organizations.settings' },
        { slug: 'packages.view' },
        { slug: 'invitations.view' },
        { slug: 'invitations.create' },
        { slug: 'invitations.cancel' },
        { slug: 'mfa.setup' },
        { slug: 'mfa.disable' },
        { slug: 'mfa.backup-codes' },
        { slug: 'audit.view' },
        // Chat permissions - automatically granted to Admin
        { slug: 'chat.view' },
        { slug: 'chat.create_group' },
        { slug: 'chat.manage_group' },
        { slug: 'chat.delete' },
        { slug: 'chat.initiate_call' },
      ],
    });

    for (const permission of adminPermissions) {
      await rolePermissionRepository.save(
        rolePermissionRepository.create({
          role_id: newAdminRole.id,
          permission_id: permission.id,
        }),
      );
    }
    console.log(`✓ Assigned ${adminPermissions.length} permissions to Admin`);
  } else {
    // Admin role already exists - ensure it has all required permissions
    console.log('- Admin role already exists, ensuring permissions are assigned...');
    const adminPermissions = await permissionRepository.find({
      where: [
        { slug: 'users.view' },
        { slug: 'users.edit' },
        { slug: 'users.delete' },
        { slug: 'users.revoke' },
        { slug: 'roles.view' },
        { slug: 'roles.create' },
        { slug: 'roles.edit' },
        { slug: 'roles.delete' },
        { slug: 'roles.assign' },
        { slug: 'organizations.view' },
        { slug: 'organizations.edit' },
        { slug: 'organizations.settings' },
        { slug: 'packages.view' },
        { slug: 'invitations.view' },
        { slug: 'invitations.create' },
        { slug: 'invitations.cancel' },
        { slug: 'mfa.setup' },
        { slug: 'mfa.disable' },
        { slug: 'mfa.backup-codes' },
        { slug: 'audit.view' },
        // Chat permissions - automatically granted to Admin
        { slug: 'chat.view' },
        { slug: 'chat.create_group' },
        { slug: 'chat.manage_group' },
        { slug: 'chat.delete' },
        { slug: 'chat.initiate_call' },
      ],
    });

    let assignedCount = 0;
    for (const permission of adminPermissions) {
      // Check if permission already exists
      const existing = await rolePermissionRepository.findOne({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });

      if (!existing) {
        await rolePermissionRepository.save(
          rolePermissionRepository.create({
            role_id: adminRole.id,
            permission_id: permission.id,
          }),
        );
        assignedCount++;
      }
    }
    if (assignedCount > 0) {
      console.log(`✓ Assigned ${assignedCount} missing permissions to existing Admin role`);
    } else {
      console.log('- Admin role already has all required permissions');
    }
  }
}
