import { DataSource } from 'typeorm';
import { Permission } from '../entities/permission.entity';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);

  const permissions = [
    // User permissions
    {
      name: 'View Users',
      slug: 'users.view',
      category: 'users',
      description: 'View organization users',
    },
    {
      name: 'Edit Users',
      slug: 'users.edit',
      category: 'users',
      description: 'Edit user information',
    },
    {
      name: 'Delete Users',
      slug: 'users.delete',
      category: 'users',
      description: 'Delete users from organization',
    },
    {
      name: 'Revoke User Access',
      slug: 'users.revoke',
      category: 'users',
      description: 'Revoke user access and transfer data',
    },
    {
      name: 'Impersonate Users',
      slug: 'users.impersonate',
      category: 'users',
      description: 'Impersonate users with lower roles for support purposes',
    },

    // Role permissions
    {
      name: 'View Roles',
      slug: 'roles.view',
      category: 'roles',
      description: 'View organization roles',
    },
    {
      name: 'Create Roles',
      slug: 'roles.create',
      category: 'roles',
      description: 'Create custom roles',
    },
    { name: 'Edit Roles', slug: 'roles.edit', category: 'roles', description: 'Edit roles' },
    { name: 'Delete Roles', slug: 'roles.delete', category: 'roles', description: 'Delete roles' },
    {
      name: 'Assign Roles',
      slug: 'roles.assign',
      category: 'roles',
      description: 'Assign roles to users',
    },

    // Organization permissions
    {
      name: 'View Organization',
      slug: 'organizations.view',
      category: 'organizations',
      description: 'View organization details and statistics',
    },
    {
      name: 'Edit Organization',
      slug: 'organizations.edit',
      category: 'organizations',
      description: 'Edit organization information',
    },
    {
      name: 'Manage Organization Settings',
      slug: 'organizations.settings',
      category: 'organizations',
      description: 'Manage organization settings including MFA',
    },

    // Package permissions
    {
      name: 'View Packages',
      slug: 'packages.view',
      category: 'packages',
      description: 'View available packages and features',
    },
    {
      name: 'Upgrade Package',
      slug: 'packages.upgrade',
      category: 'packages',
      description: 'Upgrade or downgrade organization package',
    },
    {
      name: 'Purchase Package Features',
      slug: 'packages.features.purchase',
      category: 'packages',
      description: 'Purchase additional package features',
    },
    {
      name: 'Cancel Package Features',
      slug: 'packages.features.cancel',
      category: 'packages',
      description: 'Cancel purchased package features',
    },

    // Invitation permissions
    {
      name: 'View Invitations',
      slug: 'invitations.view',
      category: 'invitations',
      description: 'View organization invitations',
    },
    {
      name: 'Create Invitations',
      slug: 'invitations.create',
      category: 'invitations',
      description: 'Create user invitations',
    },
    {
      name: 'Cancel Invitations',
      slug: 'invitations.cancel',
      category: 'invitations',
      description: 'Cancel pending invitations',
    },

    // MFA/2FA permissions
    {
      name: 'Setup 2FA',
      slug: 'mfa.setup',
      category: 'mfa',
      description: 'Setup two-factor authentication',
    },
    {
      name: 'Disable 2FA',
      slug: 'mfa.disable',
      category: 'mfa',
      description: 'Disable two-factor authentication',
    },
    {
      name: 'View Backup Codes',
      slug: 'mfa.backup-codes',
      category: 'mfa',
      description: 'View 2FA backup codes',
    },

    // Audit permissions
    {
      name: 'View Audit Logs',
      slug: 'audit.view',
      category: 'audit',
      description: 'View organization audit logs',
    },

    // Chat permissions
    {
      name: 'View Chats',
      slug: 'chat.view',
      category: 'chat',
      description: 'View and access chats',
    },
    {
      name: 'Create Group Chats',
      slug: 'chat.create_group',
      category: 'chat',
      description: 'Create new group chats',
    },
    {
      name: 'Manage Group Chats',
      slug: 'chat.manage_group',
      category: 'chat',
      description: 'Manage group chat settings, add/remove members',
    },
    {
      name: 'Delete Chats',
      slug: 'chat.delete',
      category: 'chat',
      description: 'Delete chats and messages',
    },
    {
      name: 'Initiate Calls',
      slug: 'chat.initiate_call',
      category: 'chat',
      description: 'Start audio and video calls',
    },
  ];

  for (const permission of permissions) {
    const existingPermission = await permissionRepository.findOne({
      where: { slug: permission.slug },
    });

    if (!existingPermission) {
      await permissionRepository.save(permissionRepository.create(permission));
      console.log(`✓ Seeded permission: ${permission.slug}`);
    } else {
      console.log(`- Permission already exists: ${permission.slug}`);
    }
  }
}
