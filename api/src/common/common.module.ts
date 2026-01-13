import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from './guards/permissions.guard';
import { EmailService } from './services/email.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { RedisService } from './services/redis.service';
import { SentryService } from './services/sentry.service';
import { AppLoggerService } from './services/logger.service';
import { CacheService } from './services/cache.service';
import { CsrfGuard } from './guards/csrf.guard';
import { SystemAdminGuard } from './guards/system-admin.guard';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { User } from '../database/entities/users.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationMember, Role, User]),
    forwardRef(() => AuditLogsModule),
  ],
  providers: [
    PermissionsGuard,
    SystemAdminGuard,
    EmailService,
    EmailTemplatesService,
    RedisService,
    SentryService,
    AppLoggerService,
    CacheService,
    CsrfGuard,
  ],
  exports: [
    TypeOrmModule,
    PermissionsGuard,
    SystemAdminGuard,
    EmailService,
    EmailTemplatesService,
    RedisService,
    SentryService,
    AppLoggerService,
    CacheService,
    CsrfGuard,
    forwardRef(() => AuditLogsModule),
  ],
})
export class CommonModule {}
