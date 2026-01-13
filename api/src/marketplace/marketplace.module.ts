import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { UserAppUsage } from '../database/entities/user_app_usage.entity';
import { UserAppFavorite } from '../database/entities/user_app_favorites.entity';
import { UserAppPinned } from '../database/entities/user_app_pinned.entity';
import { App } from '../database/entities/apps.entity';
import { AppSessionGuard } from './guards/app-session.guard';
import { MfaModule } from '../mfa/mfa.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAppUsage, UserAppFavorite, UserAppPinned, App]),
    MfaModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, AppSessionGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}

