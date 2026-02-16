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
import { App } from '../database/entities/apps.entity';
import { UserAppAccess } from '../database/entities/user_app_access.entity';
import { AppAccessGuard } from './guards/app-access.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationMember, Role, User, App, UserAppAccess]),
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
    AppAccessGuard,
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
    AppAccessGuard,
    forwardRef(() => AuditLogsModule),
  ],
})
export class CommonModule { }
