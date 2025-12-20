import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between } from 'typeorm';
import { Organization } from '../database/entities/organizations.entity';
import { Package } from '../database/entities/packages.entity';
import {
  NotificationHelperService,
  NotificationType,
} from '../notifications/notification-helper.service';
import { EmailService } from '../common/services/email.service';
import { EmailTemplatesService } from '../common/services/email-templates.service';
import { User } from '../database/entities/users.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization_members.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PackageExpirationService {
  private readonly logger = new Logger(PackageExpirationService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private notificationHelper: NotificationHelperService,
    private emailService: EmailService,
    private emailTemplatesService: EmailTemplatesService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Check for packages expiring in 7 days (runs daily at 9 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkPackagesExpiringIn7Days() {
    this.logger.log('Checking for packages expiring in 7 days...');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    sevenDaysFromNow.setHours(0, 0, 0, 0);

    const sevenDaysPlusOne = new Date(sevenDaysFromNow);
    sevenDaysPlusOne.setDate(sevenDaysPlusOne.getDate() + 1);

    const organizations = await this.organizationRepository.find({
      where: {
        package_expires_at: Between(sevenDaysFromNow, sevenDaysPlusOne),
      },
      relations: ['package'],
    });

    for (const org of organizations) {
      if (!org.package || org.package.slug === 'freemium') {
        continue;
      }

      try {
        // Send notification (once per day, so this will only send once)
        await this.notificationHelper.notifyPackageExpiringSoon(org.id, org.package.name, 7);

        // Send email to organization email and admin emails
        await this.sendPackageExpiringEmails(org, 7);

        this.logger.log(`Sent 7-day expiration warning to organization ${org.id}`);
      } catch (error) {
        this.logger.error(`Error sending 7-day expiration warning for org ${org.id}:`, error);
      }
    }

    this.logger.log(`Checked ${organizations.length} organizations expiring in 7 days`);
  }

  /**
   * Check for packages expiring in 3 days (runs daily at 9 AM)
   * Sends notifications twice in the last 3 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkPackagesExpiringIn3Days() {
    this.logger.log('Checking for packages expiring in 3 days or less...');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const organizations = await this.organizationRepository.find({
      where: {
        package_expires_at: Between(now, threeDaysFromNow),
      },
      relations: ['package'],
    });

    for (const org of organizations) {
      if (!org.package || org.package.slug === 'freemium') {
        continue;
      }

      try {
        const daysRemaining = Math.ceil(
          (org.package_expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Send notification (will be sent daily, so twice in 3 days)
        await this.notificationHelper.notifyPackageExpiringSoon(
          org.id,
          org.package.name,
          daysRemaining,
        );

        // Send email to organization email and admin emails (daily for last 3 days)
        await this.sendPackageExpiringEmails(org, daysRemaining);

        this.logger.log(`Sent ${daysRemaining}-day expiration warning to organization ${org.id}`);
      } catch (error) {
        this.logger.error(`Error sending expiration warning for org ${org.id}:`, error);
      }
    }

    this.logger.log(`Checked ${organizations.length} organizations expiring in 3 days or less`);
  }

  /**
   * Check for expired packages and revert to freemium (runs daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredPackages() {
    this.logger.log('Checking for expired packages...');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const organizations = await this.organizationRepository.find({
      where: {
        package_expires_at: LessThanOrEqual(now),
      },
      relations: ['package'],
    });

    // Get freemium package
    const freemiumPackage = await this.packageRepository.findOne({
      where: { slug: 'freemium' },
    });

    if (!freemiumPackage) {
      this.logger.error('Freemium package not found! Cannot revert expired packages.');
      return;
    }

    for (const org of organizations) {
      // Skip if already on freemium
      if (org.package?.slug === 'freemium') {
        continue;
      }

      try {
        const oldPackageName = org.package?.name || 'Unknown';

        // Revert to freemium
        const freemiumLimits = await this.calculateFreemiumLimits(org.id, freemiumPackage.id);

        const oldPackageId = org.package_id;
        const oldUserLimit = org.user_limit;
        const oldRoleLimit = org.role_limit;

        await this.organizationRepository.update(
          { id: org.id },
          {
            package_id: freemiumPackage.id,
            package_expires_at: null,
            user_limit: freemiumLimits.users,
            role_limit: freemiumLimits.roles,
          },
        );

        // Send notification
        await this.notificationHelper.notifyPackageExpired(org.id, oldPackageName);

        // Send email
        await this.sendPackageExpiredEmails(org, oldPackageName);

        // Create audit log (system action, no user_id)
        await this.auditLogsService.createAuditLog(
          org.id,
          null, // System action
          'package.expired',
          'package',
          oldPackageId.toString(),
          {
            package_id: oldPackageId,
            package_name: oldPackageName,
            user_limit: oldUserLimit,
            role_limit: oldRoleLimit,
            package_expires_at: org.package_expires_at,
          },
          {
            package_id: freemiumPackage.id,
            package_name: freemiumPackage.name,
            user_limit: freemiumLimits.users,
            role_limit: freemiumLimits.roles,
            package_expires_at: null,
            reason: 'Package expired - automatically reverted to freemium',
          },
        );

        this.logger.log(`Reverted organization ${org.id} from ${oldPackageName} to Freemium`);
      } catch (error) {
        this.logger.error(`Error reverting expired package for org ${org.id}:`, error);
      }
    }

    this.logger.log(`Checked ${organizations.length} organizations with expired packages`);
  }

  /**
   * Send expiration warning emails
   */
  private async sendPackageExpiringEmails(
    organization: Organization,
    daysRemaining: number,
  ): Promise<void> {
    try {
      // Get organization owner and admins
      const members = await this.memberRepository.find({
        where: {
          organization_id: organization.id,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role', 'user'],
      });

      const adminsAndOwners = members.filter(
        (m) => m.role.is_organization_owner || m.role.slug === 'admin',
      );

      const emailRecipients = new Set<string>();

      // Add organization email
      if (organization.email) {
        emailRecipients.add(organization.email);
      }

      // Add admin/owner emails
      for (const member of adminsAndOwners) {
        if (member.user?.email) {
          emailRecipients.add(member.user.email);
        }
      }

      // Send emails
      for (const email of emailRecipients) {
        const user = await this.userRepository.findOne({ where: { email } });
        const userName = user
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
          : organization.name;

        // Check if should send email (for users, respect preferences)
        if (user) {
          const shouldSend = await this.notificationHelper.shouldSendEmail(
            user.id,
            organization.id,
            NotificationType.PACKAGE_EXPIRING_SOON,
          );
          if (!shouldSend) {
            continue;
          }
        }

        const emailHtml = this.emailTemplatesService.getPackageExpiringEmail(
          userName,
          organization.name,
          organization.package.name,
          daysRemaining,
        );

        await this.emailService.sendEmail(
          email,
          `Action Required: Your ${organization.package.name} Package Expires in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
          emailHtml,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending expiration emails for org ${organization.id}:`, error);
    }
  }

  /**
   * Send package expired emails
   */
  private async sendPackageExpiredEmails(
    organization: Organization,
    expiredPackageName: string,
  ): Promise<void> {
    try {
      // Get organization owner and admins
      const members = await this.memberRepository.find({
        where: {
          organization_id: organization.id,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role', 'user'],
      });

      const adminsAndOwners = members.filter(
        (m) => m.role.is_organization_owner || m.role.slug === 'admin',
      );

      const emailRecipients = new Set<string>();

      // Add organization email
      if (organization.email) {
        emailRecipients.add(organization.email);
      }

      // Add admin/owner emails
      for (const member of adminsAndOwners) {
        if (member.user?.email) {
          emailRecipients.add(member.user.email);
        }
      }

      // Send emails
      for (const email of emailRecipients) {
        const user = await this.userRepository.findOne({ where: { email } });
        const userName = user
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
          : organization.name;

        // Check if should send email (for users, respect preferences)
        if (user) {
          const shouldSend = await this.notificationHelper.shouldSendEmail(
            user.id,
            organization.id,
            NotificationType.PACKAGE_EXPIRED,
          );
          if (!shouldSend) {
            continue;
          }
        }

        const emailHtml = this.emailTemplatesService.getPackageExpiredEmail(
          userName,
          organization.name,
          expiredPackageName,
        );

        await this.emailService.sendEmail(
          email,
          `Your ${expiredPackageName} Package Has Expired`,
          emailHtml,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending expired emails for org ${organization.id}:`, error);
    }
  }

  /**
   * Calculate freemium limits
   */
  private async calculateFreemiumLimits(
    organizationId: string,
    freemiumPackageId: number,
  ): Promise<{ users: number; roles: number }> {
    const freemiumPackage = await this.packageRepository.findOne({
      where: { id: freemiumPackageId },
    });

    if (!freemiumPackage) {
      throw new Error('Freemium package not found');
    }

    // Get active features (they might still be active even after package expires)
    // But for now, we'll just use base limits
    return {
      users: freemiumPackage.base_user_limit,
      roles: freemiumPackage.base_role_limit + freemiumPackage.additional_role_limit,
    };
  }
}
