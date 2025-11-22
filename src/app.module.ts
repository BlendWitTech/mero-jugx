import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { RolesModule } from './roles/roles.module';
import { PackagesModule } from './packages/packages.module';
import { MfaModule } from './mfa/mfa.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Common module (guards, decorators, etc.)
    CommonModule,
    // Feature modules
    AuthModule,
    OrganizationsModule,
    UsersModule,
    InvitationsModule,
    RolesModule,
    PackagesModule,
    MfaModule,
    NotificationsModule,
    AuditLogsModule,
    PaymentsModule,
    // PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

