import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Package } from '../database/entities/package.entity';
import { PackageFeature, PackageFeatureType } from '../database/entities/package-feature.entity';
import {
  OrganizationPackageFeature,
  OrganizationPackageFeatureStatus,
} from '../database/entities/organization-package-feature.entity';
import { Organization } from '../database/entities/organization.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { UpgradePackageDto, SubscriptionPeriod } from './dto/upgrade-package.dto';
import { PurchaseFeatureDto } from './dto/purchase-feature.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { calculateSubscription, calculateUpgradePrice } from './utils/subscription.utils';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(PackageFeature)
    private featureRepository: Repository<PackageFeature>,
    @InjectRepository(OrganizationPackageFeature)
    private orgFeatureRepository: Repository<OrganizationPackageFeature>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private dataSource: DataSource,
    private auditLogsService: AuditLogsService,
  ) {}

  async getPackages(organizationId?: string): Promise<Package[]> {
    const packages = await this.packageRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', created_at: 'ASC' },
    });

    // If organizationId is provided, filter out freemium if they've upgraded before
    if (organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: organizationId },
      });

      if (organization?.has_upgraded_from_freemium) {
        return packages.filter((pkg) => pkg.slug !== 'freemium');
      }
    }

    return packages;
  }

  async getPackageById(packageId: number): Promise<Package> {
    const pkg = await this.packageRepository.findOne({
      where: { id: packageId, is_active: true },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return pkg;
  }

  async getCurrentPackage(
    userId: string,
    organizationId: string,
  ): Promise<{
    package: Package;
    current_limits: { users: number; roles: number };
    active_features: OrganizationPackageFeature[];
  }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get organization with package
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get active features
    const activeFeatures = await this.orgFeatureRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
      relations: ['feature'],
    });

    // Ensure package is loaded - if package_id exists but package is null, reload it
    let packageData = organization.package;
    if (organization.package_id && !packageData) {
      packageData = await this.packageRepository.findOne({
        where: { id: organization.package_id, is_active: true },
      });
    }

    return {
      package: packageData,
      current_limits: {
        users: organization.user_limit,
        roles: organization.role_limit,
      },
      active_features: activeFeatures,
      package_expires_at: organization.package_expires_at,
      package_auto_renew: organization.package_auto_renew,
    };
  }

  async upgradePackage(
    userId: string,
    organizationId: string,
    dto: UpgradePackageDto,
  ): Promise<{ message: string; package: Package; new_limits: { users: number; roles: number } }> {
    // Verify user is member and has permission (packages.upgrade)
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

    // Check permission (packages.upgrade)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'packages.upgrade',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to upgrade packages');
      }
    }

    // Get new package
    const newPackage = await this.packageRepository.findOne({
      where: { id: dto.package_id, is_active: true },
    });

    if (!newPackage) {
      throw new NotFoundException('Package not found');
    }

    // Get organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if already on this package (handle both string and number types)
    const currentPackageId =
      typeof organization.package_id === 'string'
        ? parseInt(organization.package_id, 10)
        : organization.package_id;
    if (currentPackageId === dto.package_id) {
      throw new ConflictException('Organization is already on this package');
    }

    // Prevent purchasing freemium if they've upgraded before
    if (newPackage.slug === 'freemium' && organization.has_upgraded_from_freemium) {
      throw new BadRequestException(
        'Freemium package is not available for purchase. It will be automatically selected when your current package expires.',
      );
    }

    // Check if this is a downgrade (lower sort_order = lower tier)
    const isDowngrade = organization.package.sort_order > newPackage.sort_order;
    const isUpgrade = organization.package.sort_order < newPackage.sort_order;

    // Prevent downgrades if package hasn't expired
    if (
      isDowngrade &&
      organization.package_expires_at &&
      organization.package_expires_at > new Date()
    ) {
      throw new BadRequestException(
        'Cannot downgrade package until current subscription expires. You can only upgrade to a higher tier package.',
      );
    }

    // Calculate new limits
    const newLimits = await this.calculateLimits(organizationId, newPackage.id);

    // Validate downgrade (if applicable and expired)
    if (isDowngrade) {
      await this.validateDowngrade(organizationId, newLimits);
    }

    // Calculate expiration date and pricing based on subscription period
    let expirationDate: Date | null = null;
    let subscriptionCalc: ReturnType<typeof calculateSubscription> | null = null;
    let proratedCredit = 0;
    let upgradePriceCalc: ReturnType<typeof calculateUpgradePrice> | null = null;

    if (newPackage.slug !== 'freemium' && newPackage.price > 0) {
      const period = dto.period || SubscriptionPeriod.THREE_MONTHS;

      // If upgrading mid-subscription, calculate prorated credit
      if (
        isUpgrade &&
        organization.package_expires_at &&
        organization.package_expires_at > new Date()
      ) {
        upgradePriceCalc = calculateUpgradePrice(
          organization.package.price || 0,
          newPackage.price,
          organization.package_expires_at,
          period,
          dto.custom_months,
        );
        proratedCredit = upgradePriceCalc.creditAmount;

        // Calculate new subscription period
        subscriptionCalc = calculateSubscription(newPackage.price, period, dto.custom_months);

        // Extend expiration from current expiration date (not from now)
        expirationDate = new Date(organization.package_expires_at);
        expirationDate.setMonth(expirationDate.getMonth() + subscriptionCalc.months);
      } else {
        // New subscription or downgrade after expiration
        subscriptionCalc = calculateSubscription(newPackage.price, period, dto.custom_months);
        expirationDate = subscriptionCalc.expirationDate;
      }
    }

    // Mark as upgraded from freemium if upgrading from freemium
    const hasUpgradedFromFreemium =
      organization.package.slug === 'freemium' || organization.has_upgraded_from_freemium;

    // Update organization package using a transaction to ensure atomicity
    const oldPackageId = organization.package_id;

    // Use update() method which directly updates the database, avoiding entity caching issues
    await this.organizationRepository.update(
      { id: organizationId },
      {
        package_id: dto.package_id,
        user_limit: newLimits.users,
        role_limit: newLimits.roles,
        package_expires_at: expirationDate,
        has_upgraded_from_freemium: hasUpgradedFromFreemium,
      },
    );

    // Log the upgrade for debugging
    console.log(
      `Package upgraded for organization ${organizationId}: ${oldPackageId} -> ${dto.package_id}`,
    );
    console.log(`New limits: ${newLimits.users} users, ${newLimits.roles} roles`);

    // Reload organization with package relation using query builder to bypass cache
    const updatedOrganization = await this.organizationRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.package', 'package')
      .where('org.id = :id', { id: organizationId })
      .getOne();

    if (!updatedOrganization) {
      throw new NotFoundException('Organization not found after upgrade');
    }

    // Verify the package was actually updated
    if (updatedOrganization.package_id !== dto.package_id) {
      console.error(
        `Package upgrade verification failed: Expected ${dto.package_id}, got ${updatedOrganization.package_id}`,
      );
      // Log the actual database state for debugging
      const rawCheck = await this.dataSource.query(
        'SELECT package_id, user_limit, role_limit FROM organizations WHERE id = $1',
        [organizationId],
      );
      console.error(`Raw database check:`, rawCheck);
      throw new BadRequestException(
        `Package upgrade failed - package ID mismatch. Expected ${dto.package_id}, got ${updatedOrganization.package_id}`,
      );
    }

    // Ensure package relation is loaded
    if (!updatedOrganization.package) {
      updatedOrganization.package = newPackage;
    }

    console.log(
      `Package upgrade verified successfully: ${updatedOrganization.package.name} (ID: ${updatedOrganization.package.id})`,
    );

    // Create audit log
    const period = dto.period || SubscriptionPeriod.THREE_MONTHS;

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'package.upgrade',
      'package',
      dto.package_id.toString(),
      {
        package_id: oldPackageId,
        package_name: organization.package?.name || 'Unknown',
        user_limit: organization.user_limit,
        role_limit: organization.role_limit,
        package_expires_at: organization.package_expires_at,
      },
      {
        package_id: dto.package_id,
        package_name: updatedOrganization.package.name,
        user_limit: newLimits.users,
        role_limit: newLimits.roles,
        package_expires_at: expirationDate,
        has_upgraded_from_freemium: hasUpgradedFromFreemium,
        subscription_period: period,
        subscription_months: subscriptionCalc?.months,
        subscription_discount_percent: subscriptionCalc?.discountPercent,
        subscription_original_price: subscriptionCalc?.originalPrice,
        subscription_discounted_price: subscriptionCalc?.discountedPrice,
      },
    );

    return {
      message: 'Package upgraded successfully',
      package: updatedOrganization.package,
      new_limits: newLimits,
      prorated_credit: proratedCredit,
      final_price: upgradePriceCalc?.finalPrice || subscriptionCalc?.discountedPrice || 0,
    };
  }

  async getPackageFeatures(): Promise<PackageFeature[]> {
    const features = await this.featureRepository.find({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });

    return features;
  }

  async purchaseFeature(
    userId: string,
    organizationId: string,
    dto: PurchaseFeatureDto,
  ): Promise<{ message: string; feature: OrganizationPackageFeature }> {
    // Verify user is member and has permission (packages.features.purchase)
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

    // Check permission
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'packages.features.purchase',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to purchase features');
      }
    }

    // Get feature
    const feature = await this.featureRepository.findOne({
      where: { id: dto.package_feature_id, is_active: true },
    });

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    // Check if already purchased
    const existing = await this.orgFeatureRepository.findOne({
      where: {
        organization_id: organizationId,
        feature_id: dto.package_feature_id,
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new ConflictException('Feature is already active for this organization');
    }

    // Get organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Create organization feature
    const orgFeature = this.orgFeatureRepository.create({
      organization_id: organizationId,
      feature_id: dto.package_feature_id,
      status: OrganizationPackageFeatureStatus.ACTIVE,
      purchased_at: new Date(),
    });

    const savedFeature = await this.orgFeatureRepository.save(orgFeature);

    // Update organization limits based on feature
    await this.updateOrganizationLimits(organizationId);

    // Create audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'package.feature.purchase',
      'package_feature',
      savedFeature.id.toString(),
      null,
      {
        feature_id: dto.package_feature_id,
        feature_name: feature.name,
        feature_type: feature.type,
        feature_value: feature.value,
        feature_price: feature.price,
      },
    );

    return {
      message: 'Feature purchased successfully',
      feature: savedFeature,
    };
  }

  async cancelFeature(
    userId: string,
    organizationId: string,
    featureId: number,
  ): Promise<{ message: string }> {
    // Verify user is member and has permission (packages.features.cancel)
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

    // Check permission
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'packages.features.cancel',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to cancel features');
      }
    }

    // Get organization feature
    const orgFeature = await this.orgFeatureRepository.findOne({
      where: {
        id: featureId,
        organization_id: organizationId,
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
      relations: ['feature'],
    });

    if (!orgFeature) {
      throw new NotFoundException('Feature not found or not active');
    }

    // Cancel feature
    orgFeature.status = OrganizationPackageFeatureStatus.CANCELLED;
    orgFeature.cancelled_at = new Date();
    await this.orgFeatureRepository.save(orgFeature);

    // Recalculate limits
    await this.updateOrganizationLimits(organizationId);

    // Validate that current usage doesn't exceed new limits
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    // Check user limit
    const activeUsers = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (activeUsers > organization.user_limit) {
      throw new BadRequestException(
        `Cannot cancel feature: Current user count (${activeUsers}) exceeds new limit (${organization.user_limit}). Please remove users first.`,
      );
    }

    // Check role limit - only count custom roles (exclude default roles: owner and admin)
    // Default roles (is_default = true or organization_id = null) don't count against the limit
    const activeCustomRoles = await this.roleRepository.count({
      where: {
        organization_id: organizationId,
        is_active: true,
        is_default: false, // Exclude default roles
      },
    });

    if (organization.role_limit !== -1 && activeCustomRoles > organization.role_limit) {
      throw new BadRequestException(
        `Cannot cancel feature: Current custom role count (${activeCustomRoles}) exceeds new limit (${organization.role_limit}). Default roles (Organization Owner and Admin) are not counted. Please remove custom roles first.`,
      );
    }

    // Create audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'package.feature.cancel',
      'package_feature',
      orgFeature.id.toString(),
      {
        feature_id: orgFeature.feature_id,
        feature_name: orgFeature.feature?.name || 'Unknown',
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
      {
        feature_id: orgFeature.feature_id,
        feature_name: orgFeature.feature?.name || 'Unknown',
        status: OrganizationPackageFeatureStatus.CANCELLED,
        cancelled_at: orgFeature.cancelled_at,
      },
    );

    return { message: 'Feature cancelled successfully' };
  }

  async calculateUpgradePrice(
    userId: string,
    organizationId: string,
    dto: UpgradePackageDto,
  ): Promise<{
    new_package_price: number;
    prorated_credit: number;
    final_price: number;
    remaining_days: number | null;
    can_upgrade: boolean;
    reason?: string;
  }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get current organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get new package
    const newPackage = await this.packageRepository.findOne({
      where: { id: dto.package_id, is_active: true },
    });

    if (!newPackage) {
      throw new NotFoundException('Package not found');
    }

    // Check if this is a downgrade
    const isDowngrade = organization.package.sort_order > newPackage.sort_order;

    // Prevent downgrades if package hasn't expired
    if (
      isDowngrade &&
      organization.package_expires_at &&
      organization.package_expires_at > new Date()
    ) {
      return {
        new_package_price: 0,
        prorated_credit: 0,
        final_price: 0,
        remaining_days: null,
        can_upgrade: false,
        reason:
          'Cannot downgrade package until current subscription expires. You can only upgrade to a higher tier package.',
      };
    }

    // Calculate upgrade price
    const period = dto.period || SubscriptionPeriod.THREE_MONTHS;
    const upgradePriceCalc = calculateUpgradePrice(
      organization.package.price || 0,
      newPackage.price,
      organization.package_expires_at,
      period,
      dto.custom_months,
    );

    const remainingDays = upgradePriceCalc.proratedCredit
      ? upgradePriceCalc.proratedCredit.remainingDays
      : null;

    return {
      new_package_price: upgradePriceCalc.newPackagePrice,
      prorated_credit: upgradePriceCalc.creditAmount,
      final_price: upgradePriceCalc.finalPrice,
      remaining_days: remainingDays,
      can_upgrade: true,
    };
  }

  async toggleAutoRenew(
    userId: string,
    organizationId: string,
    enabled: boolean,
  ): Promise<{ message: string; auto_renew: boolean }> {
    // Verify user is member and has permission (packages.upgrade)
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

    // Check permission (packages.upgrade)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'packages.upgrade',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to manage package settings');
      }
    }

    // Get organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Store old value for audit log
    const oldAutoRenew = organization.package_auto_renew;

    // Update auto-renewal setting
    organization.package_auto_renew = enabled;
    await this.organizationRepository.save(organization);

    // Create audit log
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'package.auto_renew.toggle',
      'organization',
      organizationId,
      {
        package_auto_renew: oldAutoRenew,
      },
      {
        package_auto_renew: enabled,
      },
    );

    return {
      message: enabled ? 'Auto-renewal enabled' : 'Auto-renewal disabled',
      auto_renew: enabled,
    };
  }

  private async calculateLimits(
    organizationId: string,
    packageId: number,
  ): Promise<{ users: number; roles: number }> {
    // Get package
    const pkg = await this.packageRepository.findOne({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Start with base limits
    let userLimit = pkg.base_user_limit;
    // Role limit = base roles + additional roles from package
    let roleLimit = pkg.base_role_limit + pkg.additional_role_limit;

    // Get active features for organization
    const activeFeatures = await this.orgFeatureRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationPackageFeatureStatus.ACTIVE,
      },
      relations: ['feature'],
    });

    // Apply feature upgrades
    for (const orgFeature of activeFeatures) {
      const feature = orgFeature.feature;
      if (feature.type === PackageFeatureType.USER_UPGRADE) {
        if (feature.value === null) {
          // Unlimited
          userLimit = -1; // -1 = unlimited
        } else if (userLimit !== -1) {
          // Only update if not already unlimited
          userLimit = Math.max(userLimit, feature.value);
        }
      } else if (feature.type === PackageFeatureType.ROLE_UPGRADE) {
        if (feature.value === null) {
          // Unlimited
          roleLimit = -1; // -1 = unlimited
        } else if (roleLimit !== -1) {
          // Only update if not already unlimited
          roleLimit = Math.max(roleLimit, feature.value);
        }
      }
    }

    return { users: userLimit, roles: roleLimit };
  }

  private async updateOrganizationLimits(organizationId: string): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const limits = await this.calculateLimits(organizationId, organization.package_id);
    organization.user_limit = limits.users;
    organization.role_limit = limits.roles;

    await this.organizationRepository.save(organization);
  }

  private async validateDowngrade(
    organizationId: string,
    newLimits: { users: number; roles: number },
  ): Promise<void> {
    // Check current user count
    const currentUsers = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (newLimits.users !== -1 && currentUsers > newLimits.users) {
      throw new BadRequestException(
        `Cannot downgrade: Current user count (${currentUsers}) exceeds new limit (${newLimits.users}). Please remove users first.`,
      );
    }

    // Check current role count - only count custom roles (exclude default roles: owner and admin)
    // Default roles (is_default = true or organization_id = null) don't count against the limit
    const currentCustomRoles = await this.roleRepository.count({
      where: {
        organization_id: organizationId,
        is_active: true,
        is_default: false, // Exclude default roles
      },
    });

    if (newLimits.roles !== -1 && currentCustomRoles > newLimits.roles) {
      throw new BadRequestException(
        `Cannot downgrade: Current custom role count (${currentCustomRoles}) exceeds new limit (${newLimits.roles}). Default roles (Organization Owner and Admin) are not counted. Please remove custom roles first.`,
      );
    }
  }
}
