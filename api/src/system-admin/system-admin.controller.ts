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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../common/guards/system-admin.guard';
import { SystemAdminService } from './system-admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrganizationStatus } from '../database/entities/organizations.entity';
import { UserStatus } from '../database/entities/users.entity';
import { AppStatus } from '../database/entities/apps.entity';

@ApiTags('System Admin')
@Controller('system-admin')
@UseGuards(JwtAuthGuard, SystemAdminGuard)
@ApiBearerAuth()
export class SystemAdminController {
  constructor(private systemAdminService: SystemAdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics retrieved successfully' })
  async getPlatformStats() {
    return this.systemAdminService.getPlatformStats();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'System settings retrieved successfully' })
  async getSettings(@Query('category') category?: string) {
    return this.systemAdminService.getSettings(category);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get a specific system setting' })
  @ApiResponse({ status: 200, description: 'System setting retrieved successfully' })
  async getSetting(@Param('key') key: string) {
    return this.systemAdminService.getSetting(key);
  }

  @Post('settings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update a system setting' })
  @ApiResponse({ status: 201, description: 'System setting created/updated successfully' })
  async setSetting(
    @Body()
    body: {
      key: string;
      value: string | null;
      description?: string;
      category?: string;
      is_public?: boolean;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.systemAdminService.setSetting(
      body.key,
      body.value,
      body.description,
      body.category,
      body.is_public,
      userId,
    );
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiResponse({ status: 200, description: 'System setting updated successfully' })
  async updateSetting(
    @Param('key') key: string,
    @Body()
    body: {
      value?: string | null;
      description?: string;
      category?: string;
      is_public?: boolean;
    },
    @CurrentUser('id') userId: string,
  ) {
    const setting = await this.systemAdminService.getSetting(key);
    return this.systemAdminService.setSetting(
      key,
      body.value !== undefined ? body.value : setting.value,
      body.description !== undefined ? body.description : setting.description,
      body.category !== undefined ? body.category : setting.category,
      body.is_public !== undefined ? body.is_public : setting.is_public,
      userId,
    );
  }

  @Delete('settings/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a system setting' })
  @ApiResponse({ status: 204, description: 'System setting deleted successfully' })
  async deleteSetting(@Param('key') key: string) {
    await this.systemAdminService.deleteSetting(key);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all system administrators' })
  @ApiResponse({ status: 200, description: 'System administrators retrieved successfully' })
  async getSystemAdmins() {
    return this.systemAdminService.getSystemAdmins();
  }

  @Put('users/:userId/system-admin')
  @ApiOperation({ summary: 'Set system admin status for a user' })
  @ApiResponse({ status: 200, description: 'System admin status updated successfully' })
  async setSystemAdmin(
    @Param('userId') userId: string,
    @Body() body: { is_system_admin: boolean; system_admin_role?: string },
  ) {
    return this.systemAdminService.setSystemAdmin(
      userId,
      body.is_system_admin,
      body.system_admin_role,
    );
  }

  // Organization Management
  @Get('organizations')
  @ApiOperation({ summary: 'Get all organizations (system admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: OrganizationStatus })
  async getAllOrganizations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: OrganizationStatus,
  ) {
    return this.systemAdminService.getAllOrganizations({
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      search,
      status,
    });
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization by ID (system admin only)' })
  async getOrganizationById(@Param('id') id: string) {
    return this.systemAdminService.getOrganizationById(id);
  }

  @Put('organizations/:id')
  @ApiOperation({ summary: 'Update organization (system admin only)' })
  async updateOrganization(@Param('id') id: string, @Body() body: any) {
    return this.systemAdminService.updateOrganization(id, body);
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users (system admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'isSystemAdmin', required: false, type: Boolean })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('isSystemAdmin') isSystemAdmin?: boolean,
  ) {
    return this.systemAdminService.getAllUsers({
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      search,
      status,
      isSystemAdmin: isSystemAdmin === undefined ? undefined : isSystemAdmin === true,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (system admin only)' })
  async getUserById(@Param('id') id: string) {
    return this.systemAdminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (system admin only)' })
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.systemAdminService.updateUser(id, body);
  }

  @Get('users/:id/organizations')
  @ApiOperation({ summary: 'Get all organizations for a user (system admin only)' })
  async getUserOrganizations(@Param('id') id: string) {
    return this.systemAdminService.getUserOrganizations(id);
  }

  // App Management
  @Get('apps')
  @ApiOperation({ summary: 'Get all apps (system admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppStatus })
  async getAllApps(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: AppStatus,
  ) {
    return this.systemAdminService.getAllApps({
      page: page ? parseInt(String(page), 10) : undefined,
      limit: limit ? parseInt(String(limit), 10) : undefined,
      search,
      status,
    });
  }

  @Get('apps/:id')
  @ApiOperation({ summary: 'Get app by ID (system admin only)' })
  async getAppById(@Param('id', ParseIntPipe) id: number) {
    return this.systemAdminService.getAppById(id);
  }

  @Put('apps/:id')
  @ApiOperation({ summary: 'Update app (system admin only)' })
  async updateApp(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.systemAdminService.updateApp(id, body);
  }
}

