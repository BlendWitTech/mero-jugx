import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../src/database/entities/user.entity';
import { Organization, OrganizationStatus } from '../../src/database/entities/organization.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../../src/database/entities/organization-member.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Package } from '../../src/database/entities/package.entity';

export class TestFixtures {
  constructor(private dataSource: DataSource) {}

  async createUser(overrides?: Partial<User>): Promise<User> {
    const userRepository = this.dataSource.getRepository(User);
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const user = userRepository.create({
      email: overrides?.email || `test${Date.now()}@example.com`,
      password_hash: passwordHash,
      first_name: overrides?.first_name || 'Test',
      last_name: overrides?.last_name || 'User',
      email_verified: overrides?.email_verified ?? true,
      status: overrides?.status || UserStatus.ACTIVE,
      ...overrides,
    });

    return await userRepository.save(user);
  }

  async createOrganization(overrides?: Partial<Organization>): Promise<Organization> {
    const orgRepository = this.dataSource.getRepository(Organization);
    const packageRepository = this.dataSource.getRepository(Package);

    // Get or create default package
    let pkg = await packageRepository.findOne({ where: { id: 1 } });
    if (!pkg) {
      pkg = packageRepository.create({
        id: 1,
        name: 'Freemium',
        slug: 'freemium',
        base_user_limit: 10,
        base_role_limit: 2,
        additional_role_limit: 0,
        price: 0,
        is_active: true,
      });
      await packageRepository.save(pkg);
    }

    const org = orgRepository.create({
      name: overrides?.name || `Test Org ${Date.now()}`,
      slug: overrides?.slug || `test-org-${Date.now()}`,
      email: overrides?.email || `org${Date.now()}@example.com`,
      package_id: pkg.id,
      status: overrides?.status || OrganizationStatus.ACTIVE,
      mfa_enabled: overrides?.mfa_enabled ?? false,
      ...overrides,
    });

    return await orgRepository.save(org);
  }

  async createRole(overrides?: Partial<Role>): Promise<Role> {
    const roleRepository = this.dataSource.getRepository(Role);

    const role = roleRepository.create({
      name: overrides?.name || `Test Role ${Date.now()}`,
      slug: overrides?.slug || `test-role-${Date.now()}`,
      description: overrides?.description || 'Test role',
      is_system_role: overrides?.is_system_role ?? false,
      is_organization_owner: overrides?.is_organization_owner ?? false,
      is_default: overrides?.is_default ?? false,
      is_active: overrides?.is_active ?? true,
      organization_id: overrides?.organization_id || null,
      ...overrides,
    });

    return await roleRepository.save(role);
  }

  async createOrganizationMember(
    userId: string,
    organizationId: string,
    roleId: number,
    overrides?: Partial<OrganizationMember>,
  ): Promise<OrganizationMember> {
    const memberRepository = this.dataSource.getRepository(OrganizationMember);

    const member = memberRepository.create({
      user_id: userId,
      organization_id: organizationId,
      role_id: roleId,
      status: overrides?.status || OrganizationMemberStatus.ACTIVE,
      joined_at: new Date(),
      ...overrides,
    });

    return await memberRepository.save(member);
  }

  async cleanup(): Promise<void> {
    // Clean up test data
    const memberRepository = this.dataSource.getRepository(OrganizationMember);
    const orgRepository = this.dataSource.getRepository(Organization);
    const userRepository = this.dataSource.getRepository(User);
    const roleRepository = this.dataSource.getRepository(Role);

    await memberRepository.delete({});
    await orgRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});
  }
}

