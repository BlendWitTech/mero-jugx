import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { Role } from '../database/entities/roles.entity';
import { Invitation } from '../database/entities/invitations.entity';
import { AuditLog } from '../database/entities/audit_logs.entity';
import { Notification } from '../database/entities/notifications.entity';
import { Chat, ChatStatus } from '../database/entities/chats.entity';
import { Message } from '../database/entities/messages.entity';
import { Payment, PaymentStatus } from '../database/entities/payments.entity';
import { InvitationStatus } from '../database/entities/invitations.entity';
import { CacheService } from '../common/services/cache.service';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsMetrics {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number; // percentage
    trend: Array<{ date: string; count: number }>;
  };
  activity: {
    total: number;
    byType: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
  };
  chat: {
    totalMessages: number;
    totalChats: number;
    activeChats: number;
    messagesPerDay: number;
    trend: Array<{ date: string; count: number }>;
  };
  notifications: {
    total: number;
    unread: number;
    readRate: number; // percentage
    trend: Array<{ date: string; count: number }>;
  };
  invitations: {
    total: number;
    pending: number;
    accepted: number;
    acceptanceRate: number; // percentage
    trend: Array<{ date: string; count: number }>;
  };
  revenue?: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number; // percentage
    trend: Array<{ date: string; amount: number }>;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive analytics for an organization
   */
  async getOrganizationAnalytics(
    organizationId: string,
    timeRange?: TimeRange,
  ): Promise<AnalyticsMetrics> {
    const cacheKey = `analytics:org:${organizationId}:${timeRange ? `${timeRange.startDate}-${timeRange.endDate}` : 'all'}`;
    
    return this.cacheService.getOrSet(cacheKey, async () => {
      const endDate = timeRange?.endDate || new Date();
      const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

      const [
        users,
        activity,
        chat,
        notifications,
        invitations,
        revenue,
      ] = await Promise.all([
        this.getUserMetrics(organizationId, startDate, endDate),
        this.getActivityMetrics(organizationId, startDate, endDate),
        this.getChatMetrics(organizationId, startDate, endDate),
        this.getNotificationMetrics(organizationId, startDate, endDate),
        this.getInvitationMetrics(organizationId, startDate, endDate),
        this.getRevenueMetrics(organizationId, startDate, endDate),
      ]);

      return {
        users,
        activity,
        chat,
        notifications,
        invitations,
        revenue,
      };
    }, 300); // Cache for 5 minutes
  }

  /**
   * Get user growth metrics
   */
  private async getUserMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const total = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    const active = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        joined_at: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Active in last 30 days
      },
    });

    const newUsers = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        joined_at: Between(startDate, endDate),
      },
    });

    // Previous period for growth calculation
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousNewUsers = await this.memberRepository.count({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        joined_at: Between(previousStartDate, startDate),
      },
    });

    const growth = previousNewUsers > 0
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100
      : newUsers > 0 ? 100 : 0;

    // Daily trend
    const trend = await this.getDailyTrend(
      this.memberRepository,
      'joined_at',
      organizationId,
      startDate,
      endDate,
      { organization_id: organizationId, status: OrganizationMemberStatus.ACTIVE },
    );

    return {
      total,
      active,
      new: newUsers,
      growth: Math.round(growth * 100) / 100,
      trend,
    };
  }

  /**
   * Get activity metrics from audit logs
   */
  private async getActivityMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const total = await this.auditLogRepository.count({
      where: {
        organization_id: organizationId,
        created_at: Between(startDate, endDate),
      },
    });

    // Activity by type
    const activities = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.organization_id = :orgId', { orgId: organizationId })
      .andWhere('audit_log.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('audit_log.action')
      .getRawMany();

    const byType: Record<string, number> = {};
    activities.forEach((item: any) => {
      byType[item.action] = parseInt(item.count, 10);
    });

    // Daily trend
    const trend = await this.getDailyTrend(
      this.auditLogRepository,
      'created_at',
      organizationId,
      startDate,
      endDate,
      { organization_id: organizationId },
    );

    return {
      total,
      byType,
      trend,
    };
  }

  /**
   * Get chat metrics
   */
  private async getChatMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const totalChats = await this.chatRepository.count({
      where: {
        organization_id: organizationId,
        created_at: Between(startDate, endDate),
      },
    });

    const activeChats = await this.chatRepository.count({
      where: {
        organization_id: organizationId,
        status: ChatStatus.ACTIVE,
      },
    });

    // Count messages in chats belonging to this organization
    const totalMessages = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.chat', 'chat')
      .where('chat.organization_id = :orgId', { orgId: organizationId })
      .andWhere('message.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getCount();

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const messagesPerDay = daysDiff > 0 ? Math.round((totalMessages / daysDiff) * 100) / 100 : 0;

    // Daily trend for messages
    const trend = await this.messageRepository
      .createQueryBuilder('message')
      .select('DATE(message.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('message.chat', 'chat')
      .where('chat.organization_id = :orgId', { orgId: organizationId })
      .andWhere('message.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalChats,
      activeChats,
      totalMessages,
      messagesPerDay,
      trend: trend.map((item: any) => ({
        date: item.date,
        count: parseInt(item.count, 10),
      })),
    };
  }

  /**
   * Get notification metrics
   */
  private async getNotificationMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const total = await this.notificationRepository.count({
      where: {
        organization_id: organizationId,
        created_at: Between(startDate, endDate),
      },
    });

    const unread = await this.notificationRepository.count({
      where: {
        organization_id: organizationId,
        read_at: null,
        created_at: Between(startDate, endDate),
      },
    });

    const readRate = total > 0 ? Math.round(((total - unread) / total) * 100 * 100) / 100 : 0;

    // Daily trend
    const trend = await this.getDailyTrend(
      this.notificationRepository,
      'created_at',
      organizationId,
      startDate,
      endDate,
      { organization_id: organizationId },
    );

    return {
      total,
      unread,
      readRate,
      trend,
    };
  }

  /**
   * Get invitation metrics
   */
  private async getInvitationMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const total = await this.invitationRepository.count({
      where: {
        organization_id: organizationId,
        created_at: Between(startDate, endDate),
      },
    });

    const pending = await this.invitationRepository.count({
      where: {
        organization_id: organizationId,
        status: InvitationStatus.PENDING,
        expires_at: MoreThan(new Date()),
      },
    });

    const accepted = await this.invitationRepository.count({
      where: {
        organization_id: organizationId,
        status: InvitationStatus.ACCEPTED,
        accepted_at: Between(startDate, endDate),
      },
    });

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100 * 100) / 100 : 0;

    // Daily trend
    const trend = await this.getDailyTrend(
      this.invitationRepository,
      'created_at',
      organizationId,
      startDate,
      endDate,
      { organization_id: organizationId },
    );

    return {
      total,
      pending,
      accepted,
      acceptanceRate,
      trend,
    };
  }

  /**
   * Get revenue metrics (if applicable)
   */
  private async getRevenueMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const payments = await this.paymentRepository.find({
      where: {
        organization_id: organizationId,
        status: PaymentStatus.COMPLETED,
        created_at: Between(startDate, endDate),
      },
    });

    const total = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

    // This month
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthPayments = payments.filter(p => p.created_at >= thisMonthStart);
    const thisMonth = thisMonthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

    // Last month
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    const lastMonthPayments = payments.filter(p => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd);
    const lastMonth = lastMonthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);

    const growth = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100 * 100) / 100
      : thisMonth > 0 ? 100 : 0;

    // Daily trend
    const trend = await this.getDailyRevenueTrend(organizationId, startDate, endDate);

    return {
      total: Math.round(total * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      lastMonth: Math.round(lastMonth * 100) / 100,
      growth,
      trend,
    };
  }

  /**
   * Get daily trend data
   */
  private async getDailyTrend(
    repository: Repository<any>,
    dateColumn: string,
    organizationId: string,
    startDate: Date,
    endDate: Date,
    additionalWhere: any = {},
  ): Promise<Array<{ date: string; count: number }>> {
    const queryBuilder = repository
      .createQueryBuilder('entity')
      .select(`DATE(entity.${dateColumn})`, 'date')
      .addSelect('COUNT(*)', 'count');

    // Add where conditions
    if (Object.keys(additionalWhere).length > 0) {
      const firstKey = Object.keys(additionalWhere)[0];
      queryBuilder.where(`entity.${firstKey} = :orgId`, { orgId: organizationId });

      Object.keys(additionalWhere).slice(1).forEach((key, index) => {
        queryBuilder.andWhere(`entity.${key} = :param${index}`, {
          [`param${index}`]: Object.values(additionalWhere)[index + 1],
        });
      });
    }

    queryBuilder.andWhere(`entity.${dateColumn} BETWEEN :start AND :end`, {
      start: startDate,
      end: endDate,
    });

    const results = await queryBuilder
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((item: any) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * Get daily revenue trend
   */
  private async getDailyRevenueTrend(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; amount: number }>> {
    const results = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.created_at)', 'date')
      .addSelect('SUM(payment.amount)', 'amount')
      .where('payment.organization_id = :orgId', { orgId: organizationId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere('payment.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((item: any) => ({
      date: item.date,
      amount: Math.round(parseFloat(item.amount || '0') * 100) / 100,
    }));
  }

  /**
   * Invalidate analytics cache for organization
   */
  async invalidateCache(organizationId: string): Promise<void> {
    await this.cacheService.deletePattern(`analytics:org:${organizationId}:*`);
  }
}

