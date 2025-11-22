import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { SwitchOrganizationDto } from './dto/switch-organization.dto';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async getCurrentOrganization(@CurrentUser() user: any) {
    return this.organizationsService.getCurrentOrganization(user.userId, user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List user organizations' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  async getUserOrganizations(@CurrentUser() user: any) {
    return this.organizationsService.getUserOrganizations(user.userId);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @Permissions('organizations.edit')
  @ApiOperation({ summary: 'Update current organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Name or email already exists' })
  async updateOrganization(@CurrentUser() user: any, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.updateOrganization(user.userId, user.organizationId, dto);
  }

  @Put('me/settings')
  @HttpCode(HttpStatus.OK)
  @Permissions('organizations.settings')
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Only organization owner can update settings' })
  async updateOrganizationSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateOrganizationSettingsDto,
  ) {
    return this.organizationsService.updateOrganizationSettings(
      user.userId,
      user.organizationId,
      dto,
    );
  }

  @Get('me/stats')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async getOrganizationStatistics(@CurrentUser() user: any) {
    return this.organizationsService.getOrganizationStatistics(user.userId, user.organizationId);
  }

  @Put('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch to another organization' })
  @ApiResponse({ status: 200, description: 'Organization switched successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async switchOrganization(@CurrentUser() user: any, @Body() dto: SwitchOrganizationDto) {
    return this.organizationsService.switchOrganization(user.userId, dto.organization_id);
  }
}
