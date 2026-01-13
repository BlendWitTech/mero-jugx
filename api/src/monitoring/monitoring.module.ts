import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MetricsService } from './metrics.service';
import { PrometheusService } from './prometheus.service';
import { User } from '../database/entities/users.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role]),
    CommonModule,
  ],
  controllers: [MonitoringController],
  providers: [MetricsService, PrometheusService],
  exports: [MetricsService, PrometheusService],
})
export class MonitoringModule {}

