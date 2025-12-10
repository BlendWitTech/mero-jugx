import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { PrometheusService } from './prometheus.service';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role]),
  ],
  controllers: [MonitoringController],
  providers: [MetricsService, PrometheusService],
  exports: [MetricsService, PrometheusService],
})
export class MonitoringModule {}

