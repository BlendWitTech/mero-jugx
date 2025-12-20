import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrganizationAppsService } from './organization-apps.service';
import { AppAccessService } from './app-access.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { PurchaseAppDto } from './dto/purchase-app.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionQueryDto } from './dto/subscription-query.dto';
import { GrantAppAccessDto } from './dto/grant-app-access.dto';
import { RevokeAppAccessDto } from './dto/revoke-app-access.dto';

@ApiTags('organization-apps')
@Controller('organizations/:orgId/apps')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class OrganizationAppsController {
  constructor(
    private readonly organizationAppsService: OrganizationAppsService,
    private readonly appAccessService: AppAccessService,
  ) {}

  @Get()
  @Permissions('apps.subscribe')
  @ApiOperation({ summary: "Get organization's app subscriptions" })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getOrganizationApps(
    @Param('orgId') orgId: string,
    @Query() query: SubscriptionQueryDto,
  ) {
    return this.organizationAppsService.getOrganizationApps(orgId, query);
  }

  @Get(':appId')
  @Permissions('apps.subscribe')
  @ApiOperation({ summary: 'Get app subscription details' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    return this.organizationAppsService.getSubscription(orgId, appId);
  }

  @Post()
  @Permissions('apps.subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase/Subscribe to an app' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 201, description: 'App subscription created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Already subscribed to this app' })
  async purchaseApp(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('orgId') orgId: string,
    @Body() dto: PurchaseAppDto,
  ) {
    if (!organization || organization.id !== orgId) {
      throw new Error('Organization mismatch');
    }
    return this.organizationAppsService.purchaseApp(orgId, user.userId, dto);
  }

  @Put(':appId')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update app subscription' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateSubscription(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.organizationAppsService.updateSubscription(orgId, appId, dto, user.userId);
  }

  @Delete(':appId')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel app subscription' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.organizationAppsService.cancelSubscription(orgId, appId, dto, user.userId);
  }

  @Post(':appId/renew')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renew app subscription' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Subscription renewed successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async renewSubscription(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body('payment_method') paymentMethod: 'stripe' | 'esewa',
  ) {
    return this.organizationAppsService.renewSubscription(
      orgId,
      appId,
      paymentMethod,
      user.userId,
    );
  }

  @Post(':appId/auto-renew/enable')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable auto-renewal for app subscription' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Auto-renewal enabled successfully' })
  async enableAutoRenew(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    return this.organizationAppsService.updateSubscription(
      orgId,
      appId,
      { auto_renew: true },
      user.userId,
    );
  }

  @Post(':appId/auto-renew/disable')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable auto-renewal for app subscription' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Auto-renewal disabled successfully' })
  async disableAutoRenew(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    return this.organizationAppsService.updateSubscription(
      orgId,
      appId,
      { auto_renew: false },
      user.userId,
    );
  }

  @Post(':appId/access/grant')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant app access to a user' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App access granted successfully' })
  async grantAppAccess(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: GrantAppAccessDto,
  ) {
    if (dto.app_id !== appId) {
      throw new BadRequestException('App ID mismatch');
    }
    const access = await this.appAccessService.grantAccess(user.userId, orgId, dto);
    return {
      success: true,
      message: 'App access granted successfully',
      data: access,
    };
  }

  @Post(':appId/access/revoke')
  @Permissions('apps.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke app access from a user' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App access revoked successfully' })
  async revokeAppAccess(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: RevokeAppAccessDto,
  ) {
    if (dto.app_id !== appId) {
      throw new BadRequestException('App ID mismatch');
    }
    await this.appAccessService.revokeAccess(user.userId, orgId, dto);
    return {
      success: true,
      message: 'App access revoked successfully',
    };
  }

  @Get(':appId/access')
  @Permissions('apps.manage')
  @ApiOperation({ summary: 'Get users with access to an app' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App access list retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAppAccess(
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    try {
      return await this.appAccessService.getAppAccessUsers(orgId, appId);
    } catch (error) {
      console.error('Error in getAppAccess:', error);
      throw error;
    }
  }

  @Get('my-access')
  @Permissions('apps.subscribe')
  @ApiOperation({ summary: 'Get apps the current user has access to' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'User accessible apps retrieved successfully' })
  async getMyAccessibleApps(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
  ) {
    return this.appAccessService.getUserAccessibleApps(user.userId, orgId);
  }

  @Get(':appId/access/check')
  @Permissions('apps.subscribe')
  @ApiOperation({ summary: 'Check if current user has access to an app' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'appId', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'Access status retrieved successfully' })
  async checkAppAccess(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    const hasAccess = await this.appAccessService.getUserAppAccess(user.userId, orgId, appId);
    return { has_access: hasAccess };
  }
}

