import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserAppUsage } from '../database/entities/user_app_usage.entity';
import { UserAppFavorite } from '../database/entities/user_app_favorites.entity';
import { UserAppPinned } from '../database/entities/user_app_pinned.entity';
import { App } from '../database/entities/apps.entity';

const MAX_FAVORITES = 4;

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(UserAppUsage)
    private usageRepo: Repository<UserAppUsage>,
    @InjectRepository(UserAppFavorite)
    private favRepo: Repository<UserAppFavorite>,
    @InjectRepository(UserAppPinned)
    private pinnedRepo: Repository<UserAppPinned>,
    @InjectRepository(App)
    private appRepo: Repository<App>,
  ) {}

  async recordUsage(userId: string, organizationId: string, appId: number) {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) {
      throw new BadRequestException('App not found');
    }

    const usage = this.usageRepo.create({
      user_id: userId,
      organization_id: organizationId,
      app_id: appId,
    });
    await this.usageRepo.save(usage);

    return { success: true };
  }

  async getLastUsed(userId: string, organizationId: string) {
    const records = await this.usageRepo.find({
      where: { user_id: userId, organization_id: organizationId },
      order: { created_at: 'DESC' },
      take: 6, // Return last 6 apps
      relations: ['app'],
    });
    // Remove duplicates and return unique apps
    const uniqueApps = new Map<number, App>();
    records.forEach((r) => {
      if (r.app && !uniqueApps.has(r.app.id)) {
        uniqueApps.set(r.app.id, r.app);
      }
    });
    return Array.from(uniqueApps.values());
  }

  async getFavorites(userId: string, organizationId: string) {
    const favs = await this.favRepo.find({
      where: { user_id: userId, organization_id: organizationId },
      order: { sort_order: 'ASC' },
      relations: ['app'],
    });
    return favs.map((f) => f.app);
  }

  async setFavorites(userId: string, organizationId: string, appIds: number[]) {
    if (!Array.isArray(appIds) || appIds.length > MAX_FAVORITES) {
      throw new BadRequestException(`You can set up to ${MAX_FAVORITES} favorites`);
    }

    // Ensure all apps exist
    const apps = await this.appRepo.findBy({ id: In(appIds) });
    if (apps.length !== appIds.length) {
      throw new BadRequestException('One or more apps are invalid');
    }

    // Replace favorites
    await this.favRepo.delete({ user_id: userId, organization_id: organizationId });

    const favs = appIds.map((id, idx) =>
      this.favRepo.create({
        user_id: userId,
        organization_id: organizationId,
        app_id: id,
        sort_order: idx,
      }),
    );
    await this.favRepo.save(favs);
    return { success: true };
  }

  async getPinned(userId: string, organizationId: string) {
    const pinned = await this.pinnedRepo.find({
      where: { user_id: userId, organization_id: organizationId },
      order: { sort_order: 'ASC', created_at: 'ASC' },
      relations: ['app'],
    });
    return pinned.map((p) => p.app).filter((app) => app !== null);
  }

  async pinApp(userId: string, organizationId: string, appId: number) {
    const app = await this.appRepo.findOne({ where: { id: appId } });
    if (!app) {
      throw new BadRequestException('App not found');
    }

    // Check if already pinned
    const existing = await this.pinnedRepo.findOne({
      where: { user_id: userId, organization_id: organizationId, app_id: appId },
    });

    if (existing) {
      return { success: true, message: 'App already pinned' };
    }

    // Get max sort order
    const maxOrder = await this.pinnedRepo
      .createQueryBuilder('pinned')
      .where('pinned.user_id = :userId', { userId })
      .andWhere('pinned.organization_id = :organizationId', { organizationId })
      .select('MAX(pinned.sort_order)', 'max')
      .getRawOne();

    const pinned = this.pinnedRepo.create({
      user_id: userId,
      organization_id: organizationId,
      app_id: appId,
      sort_order: (maxOrder?.max ?? -1) + 1,
    });

    await this.pinnedRepo.save(pinned);
    return { success: true };
  }

  async unpinApp(userId: string, organizationId: string, appId: number) {
    await this.pinnedRepo.delete({
      user_id: userId,
      organization_id: organizationId,
      app_id: appId,
    });
    return { success: true };
  }

  async setPinned(userId: string, organizationId: string, appIds: number[]) {
    // Ensure all apps exist
    const apps = await this.appRepo.findBy({ id: In(appIds) });
    if (apps.length !== appIds.length) {
      throw new BadRequestException('One or more apps are invalid');
    }

    // Replace pinned apps
    await this.pinnedRepo.delete({ user_id: userId, organization_id: organizationId });

    const pinned = appIds.map((id, idx) =>
      this.pinnedRepo.create({
        user_id: userId,
        organization_id: organizationId,
        app_id: id,
        sort_order: idx,
      }),
    );
    await this.pinnedRepo.save(pinned);
    return { success: true };
  }
}

