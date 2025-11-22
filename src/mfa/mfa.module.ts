import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
import { CommonModule } from '../common/common.module';
import { MfaSetupGuard } from '../auth/guards/mfa-setup.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role]), CommonModule],
  controllers: [MfaController],
  providers: [MfaService, MfaSetupGuard],
  exports: [MfaService],
})
export class MfaModule {}
