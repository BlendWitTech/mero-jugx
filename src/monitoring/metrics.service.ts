import { Injectable } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity';
import { Organization, OrganizationStatus } from '../database/entities/organization.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';

@Injectable()
export class MetricsService {
  constructor(
    private readonly prometheusService: PrometheusService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {
    // Update business metrics periodically
    setInterval(() => {
      this.updateBusinessMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Update business metrics
   */
  private async updateBusinessMetrics() {
    try {
      // Count active users
      const activeUsersCount = await this.userRepository.count({
        where: { status: UserStatus.ACTIVE },
      });
      this.prometheusService.activeUsers.set(activeUsersCount);

      // Count active organizations
      const activeOrgsCount = await this.organizationRepository.count({
        where: { status: OrganizationStatus.ACTIVE },
      });
      this.prometheusService.activeOrganizations.set(activeOrgsCount);
    } catch (error) {
      console.error('Error updating business metrics:', error);
    }
  }

  /**
   * Get custom metrics summary
   */
  async getMetricsSummary(): Promise<{
    http: {
      totalRequests: number;
      errors: number;
      avgDuration: number;
    };
    database: {
      activeConnections: number;
      avgQueryDuration: number;
    };
    cache: {
      hits: number;
      misses: number;
      hitRate: number;
    };
    business: {
      activeUsers: number;
      activeOrganizations: number;
    };
    system: {
      memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
      };
      cpu: number;
    };
  }> {
    // This would typically query Prometheus or aggregate from the metrics
    // For now, return a simplified version
    return {
      http: {
        totalRequests: 0,
        errors: 0,
        avgDuration: 0,
      },
      database: {
        activeConnections: 0,
        avgQueryDuration: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      business: {
        activeUsers: await this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        activeOrganizations: await this.organizationRepository.count({ where: { status: OrganizationStatus.ACTIVE } }),
      },
      system: {
        memory: process.memoryUsage(),
        cpu: 0,
      },
    };
  }
}

