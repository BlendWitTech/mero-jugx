import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, FindOptionsWhere } from 'typeorm';
import { App, AppStatus } from '../database/entities/apps.entity';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { AppQueryDto } from './dto/app-query.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private dataSource: DataSource,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Find all apps with filters and pagination
   */
  async findAll(query: AppQueryDto): Promise<PaginatedResponse<App>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<App> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.is_featured !== undefined) {
      where.is_featured = query.is_featured;
    }

    if (query.target_audience) {
      where.target_audience = query.target_audience;
    }

    const queryBuilder = this.appRepository.createQueryBuilder('app');

    // Apply filters
    if (where.status) {
      queryBuilder.andWhere('app.status = :status', { status: where.status });
    }
    if (where.category) {
      queryBuilder.andWhere('app.category = :category', { category: where.category });
    }
    if (where.is_featured !== undefined) {
      queryBuilder.andWhere('app.is_featured = :is_featured', {
        is_featured: where.is_featured,
      });
    }
    if (where.target_audience) {
      queryBuilder.andWhere('app.target_audience = :target_audience', {
        target_audience: where.target_audience,
      });
    }

    // Search
    if (query.search) {
      queryBuilder.andWhere(
        '(app.name ILIKE :search OR app.description ILIKE :search OR app.short_description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Sorting
    const sort = query.sort || 'created_at';
    const order = query.order || 'desc';
    queryBuilder.orderBy(`app.${sort}`, order.toUpperCase() as 'ASC' | 'DESC');

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one app by ID
   */
  async findOne(id: number): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  /**
   * Find one app by slug
   */
  async findOneBySlug(slug: string): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { slug },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  /**
   * Create a new app (Admin only)
   */
  async create(dto: CreateAppDto, userId: string): Promise<App> {
    // Check if slug already exists
    const existingApp = await this.appRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existingApp) {
      throw new ConflictException('App with this slug already exists');
    }

    // Check if name already exists
    const existingName = await this.appRepository.findOne({
      where: { name: dto.name },
    });

    if (existingName) {
      throw new ConflictException('App with this name already exists');
    }

    const app = this.appRepository.create({
      ...dto,
      status: AppStatus.DRAFT, // New apps start as draft
    });

    const savedApp = await this.appRepository.save(app);

    // Audit log
    await this.auditLogsService.createAuditLog(
      null, // organizationId
      userId,
      'app.created',
      'app',
      savedApp.id.toString(),
      null, // oldValues
      { app_name: savedApp.name, app_slug: savedApp.slug }, // newValues
    );

    return savedApp;
  }

  /**
   * Update an app (Admin only)
   */
  async update(id: number, dto: UpdateAppDto, userId: string): Promise<App> {
    const app = await this.findOne(id);

    // Check slug uniqueness if being updated
    if (dto.slug && dto.slug !== app.slug) {
      const existingApp = await this.appRepository.findOne({
        where: { slug: dto.slug },
      });

      if (existingApp) {
        throw new ConflictException('App with this slug already exists');
      }
    }

    // Check name uniqueness if being updated
    if (dto.name && dto.name !== app.name) {
      const existingName = await this.appRepository.findOne({
        where: { name: dto.name },
      });

      if (existingName) {
        throw new ConflictException('App with this name already exists');
      }
    }

    Object.assign(app, dto);
    const updatedApp = await this.appRepository.save(app);

    // Audit log
    await this.auditLogsService.createAuditLog(
      null, // organizationId
      userId,
      'app.updated',
      'app',
      id.toString(),
      null, // oldValues
      dto, // newValues
    );

    return updatedApp;
  }

  /**
   * Delete an app (Admin only)
   */
  async delete(id: number, userId: string): Promise<void> {
    const app = await this.findOne(id);

    await this.appRepository.remove(app);

    // Audit log
    await this.auditLogsService.createAuditLog(
      null, // organizationId
      userId,
      'app.deleted',
      'app',
      id.toString(),
      { app_name: app.name, app_slug: app.slug }, // oldValues
      null, // newValues
    );
  }

  /**
   * Get featured apps
   */
  async getFeaturedApps(limit: number = 10): Promise<App[]> {
    return this.appRepository.find({
      where: {
        status: AppStatus.ACTIVE,
        is_featured: true,
      },
      order: {
        sort_order: 'ASC',
        created_at: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get app categories
   */
  async getCategories(): Promise<string[]> {
    const apps = await this.appRepository.find({
      where: { status: AppStatus.ACTIVE },
      select: ['category'],
    });

    // Get unique categories
    const categories = [...new Set(apps.map((app) => app.category))];
    return categories.sort();
  }

  /**
   * Browse apps (Public endpoint - only active apps)
   */
  async browseApps(query: AppQueryDto): Promise<PaginatedResponse<App>> {
    // Force status to active for public browsing
    const publicQuery = { ...query, status: AppStatus.ACTIVE };
    return this.findAll(publicQuery);
  }

  /**
   * Get public app details (only active apps)
   */
  async getPublicAppDetails(id: number): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id, status: AppStatus.ACTIVE },
    });

    if (!app) {
      throw new NotFoundException('App not found or not available');
    }

    return app;
  }

  /**
   * Increment subscription count (called when subscription is created)
   */
  async incrementSubscriptionCount(appId: number): Promise<void> {
    await this.appRepository.increment({ id: appId }, 'subscription_count', 1);
  }

  /**
   * Decrement subscription count (called when subscription is cancelled/expired)
   */
  async decrementSubscriptionCount(appId: number): Promise<void> {
    await this.appRepository.decrement({ id: appId }, 'subscription_count', 1);
  }
}

