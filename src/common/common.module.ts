import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from './guards/permissions.guard';
import { EmailService } from './services/email.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { RedisService } from './services/redis.service';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationMember, Role])],
  providers: [PermissionsGuard, EmailService, EmailTemplatesService, RedisService],
  exports: [PermissionsGuard, EmailService, EmailTemplatesService, RedisService],
})
export class CommonModule {}
