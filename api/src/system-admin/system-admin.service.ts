import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { SystemSetting } from '../database/entities/system_settings.entity';
import { User, UserStatus } from '../database/entities/users.entity';
import { Organization, OrganizationStatus } from '../database/entities/organizations.entity';
import { App, AppStatus } from '../database/entities/apps.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';

@Injectable()
export class SystemAdminService {
  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {}

  // System Settings
  async getSettings(category?: string): Promise<SystemSetting[]> {
    const queryBuilder = this.systemSettingRepository.createQueryBuilder('setting');

    if (category) {
      queryBuilder.where('setting.category = :category', { category });
    }

    return queryBuilder.orderBy('setting.key', 'ASC').getMany();
  }

  async getSetting(key: string): Promise<SystemSetting> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async setSetting(
    key: string,
    value: string | null,
    description?: string,
    category?: string,
    isPublic?: boolean,
    updatedBy?: string,
  ): Promise<SystemSetting> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
      if (category !== undefined) setting.category = category;
      if (isPublic !== undefined) setting.is_public = isPublic;
      if (updatedBy) setting.updated_by = updatedBy;
    } else {
      setting = this.systemSettingRepository.create({
        key,
        value,
        description,
        category,
        is_public: isPublic || false,
        updated_by: updatedBy,
      });
    }

    return this.systemSettingRepository.save(setting);
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    await this.systemSettingRepository.remove(setting);
  }

  // User Management
  async getSystemAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { is_system_admin: true },
      select: ['id', 'email', 'first_name', 'last_name', 'is_system_admin', 'system_admin_role', 'status', 'created_at'],
    });
  }

  async setSystemAdmin(userId: string, isSystemAdmin: boolean, role?: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_system_admin = isSystemAdmin;
    if (role !== undefined) {
      user.system_admin_role = role;
    }

    return this.userRepository.save(user);
  }

  // Platform Statistics
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalOrganizations: number;
    activeOrganizations: number;
    totalApps: number;
    activeApps: number;
    systemAdmins: number;
  }> {
    const [
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      totalApps,
      activeApps,
      systemAdmins,
    ] = await Promise.all([
      this.userRepository.count(),
      this.organizationRepository.count(),
      this.organizationRepository.count({
        where: { status: OrganizationStatus.ACTIVE },
      }),
      this.appRepository.count(),
      this.appRepository.count({
        where: { status: AppStatus.ACTIVE },
      }),
      this.userRepository.count({
        where: { is_system_admin: true },
      }),
    ]);

    return {
      totalUsers,
      totalOrganizations,
      activeOrganizations,
      totalApps,
      activeApps,
      systemAdmins,
    };
  }

  // Organization Management (System Admin)
  async getAllOrganizations(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrganizationStatus;
  }): Promise<{
    organizations: Organization[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.organizationRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.package', 'package')
      .orderBy('org.created_at', 'DESC');

    if (query.search) {
      queryBuilder.andWhere(
        '(org.name ILIKE :search OR org.email ILIKE :search OR org.slug ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      queryBuilder.andWhere('org.status = :status', { status: query.status });
    }

    const total = await queryBuilder.getCount();
    const organizations = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrganizationById(organizationId: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    Object.assign(organization, updates);
    return this.organizationRepository.save(organization);
  }

  // User Management (System Admin)
  async getAllUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    isSystemAdmin?: boolean;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.phone',
        'user.avatar_url',
        'user.email_verified',
        'user.status',
        'user.is_system_admin',
        'user.system_admin_role',
        'user.created_at',
        'user.updated_at',
        'user.last_login_at',
      ])
      .orderBy('user.created_at', 'DESC');

    if (query.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    if (query.isSystemAdmin !== undefined) {
      queryBuilder.andWhere('user.is_system_admin = :isSystemAdmin', {
        isSystemAdmin: query.isSystemAdmin,
      });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'first_name',
        'last_name',
        'phone',
        'avatar_url',
        'email_verified',
        'email_verified_at',
        'mfa_enabled',
        'status',
        'is_system_admin',
        'system_admin_role',
        'created_at',
        'updated_at',
        'last_login_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow updating password_hash directly (use separate endpoint if needed)
    const { password_hash, ...safeUpdates } = updates;
    Object.assign(user, safeUpdates);

    return this.userRepository.save(user);
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const memberships = await this.memberRepository.find({
      where: { user_id: userId },
      relations: ['organization', 'organization.package'],
    });

    return memberships.map((m) => m.organization);
  }

  // App Management (System Admin)
  async getAllApps(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AppStatus;
  }): Promise<{
    apps: App[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.appRepository.createQueryBuilder('app').orderBy('app.created_at', 'DESC');

    if (query.search) {
      queryBuilder.andWhere('(app.name ILIKE :search OR app.slug ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('app.status = :status', { status: query.status });
    }

    const total = await queryBuilder.getCount();
    const apps = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      apps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAppById(appId: number): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id: appId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  async updateApp(appId: number, updates: Partial<App>): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id: appId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    Object.assign(app, updates);
    return this.appRepository.save(app);
  }
}

