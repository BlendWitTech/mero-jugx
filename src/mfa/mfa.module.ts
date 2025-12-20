import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { User } from '../database/entities/users.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { CommonModule } from '../common/common.module';
import { MfaSetupGuard } from '../auth/guards/mfa-setup.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, OrganizationMember, Role]), CommonModule],
  controllers: [MfaController],
  providers: [MfaService, MfaSetupGuard],
  exports: [MfaService],
})
export class MfaModule {}
