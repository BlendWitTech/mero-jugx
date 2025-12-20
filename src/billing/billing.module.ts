import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Payment } from '../database/entities/payments.entity';
import { Organization } from '../database/entities/organizations.entity';
import { Package } from '../database/entities/packages.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { CommonModule } from '../common/common.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Organization, Package, OrganizationMember, Role]),
    CommonModule,
    PaymentsModule,
    AuditLogsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

