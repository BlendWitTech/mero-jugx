import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { AppSessionGuard } from './guards/app-session.guard';
import { AppReauthDto } from './dto/app-reauth.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('reauth')
  @UseGuards(AppSessionGuard)
  @ApiOperation({ summary: 'Re-authenticate for marketplace app usage (password or MFA)' })
  reauth(
    @CurrentUser('id') userId: string,
    @Body() _dto: AppReauthDto,
    @Req() request: Request,
  ) {
    // AppSessionGuard handles validation and token creation
    const appSessionToken = (request as any).appSessionToken;
    if (!appSessionToken) {
      throw new Error('App session token not generated');
    }
    return { app_session_token: appSessionToken };
  }

  @Get('last-used')
  @ApiOperation({ summary: 'Get last used apps for the current user' })
  async getLastUsed(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
  ) {
    return this.marketplaceService.getLastUsed(userId, organizationId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite apps for the current user' })
  async getFavorites(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
  ) {
    return this.marketplaceService.getFavorites(userId, organizationId);
  }

  @Post('favorites')
  @ApiOperation({ summary: 'Set favorite apps (up to 4)' })
  async setFavorites(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: { app_ids: number[] },
  ) {
    return this.marketplaceService.setFavorites(userId, organizationId, dto.app_ids);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Record app usage event (open/activate)' })
  async recordUsage(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: { app_id: number },
  ) {
    return this.marketplaceService.recordUsage(userId, organizationId, dto.app_id);
  }

  @Get('pinned')
  @ApiOperation({ summary: 'Get pinned apps for the current user' })
  async getPinned(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
  ) {
    return this.marketplaceService.getPinned(userId, organizationId);
  }

  @Post('pinned')
  @ApiOperation({ summary: 'Pin an app to the sidebar' })
  async pinApp(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: { app_id: number },
  ) {
    return this.marketplaceService.pinApp(userId, organizationId, dto.app_id);
  }

  @Post('pinned/unpin')
  @ApiOperation({ summary: 'Unpin an app from the sidebar' })
  async unpinApp(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: { app_id: number },
  ) {
    return this.marketplaceService.unpinApp(userId, organizationId, dto.app_id);
  }
}

