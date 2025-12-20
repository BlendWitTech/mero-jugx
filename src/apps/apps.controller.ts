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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { AppQueryDto } from './dto/app-query.dto';

@ApiTags('apps')
@Controller('apps')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @Permissions('apps.view')
  @ApiOperation({ summary: 'List all apps (with filters)' })
  @ApiResponse({ status: 200, description: 'Apps retrieved successfully' })
  async getApps(@Query() query: AppQueryDto) {
    return this.appsService.findAll(query);
  }

  @Get('featured')
  @Permissions('apps.view')
  @ApiOperation({ summary: 'Get featured apps' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of featured apps to return' })
  @ApiResponse({ status: 200, description: 'Featured apps retrieved successfully' })
  async getFeaturedApps(@Query('limit') limit?: number) {
    return this.appsService.getFeaturedApps(limit ? parseInt(limit.toString(), 10) : 10);
  }

  @Get('categories')
  @Permissions('apps.view')
  @ApiOperation({ summary: 'Get app categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.appsService.getCategories();
  }

  @Get(':id')
  @Permissions('apps.view')
  @ApiOperation({ summary: 'Get app by ID' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App retrieved successfully' })
  @ApiResponse({ status: 404, description: 'App not found' })
  async getApp(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.findOne(id);
  }

  @Post()
  @Permissions('apps.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new app (Admin only)' })
  @ApiResponse({ status: 201, description: 'App created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'App with this slug or name already exists' })
  async createApp(@CurrentUser() user: any, @Body() dto: CreateAppDto) {
    return this.appsService.create(dto, user.userId);
  }

  @Put(':id')
  @Permissions('apps.edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an app (Admin only)' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App updated successfully' })
  @ApiResponse({ status: 404, description: 'App not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateApp(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppDto,
  ) {
    return this.appsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @Permissions('apps.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an app (Admin only)' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ status: 204, description: 'App deleted successfully' })
  @ApiResponse({ status: 404, description: 'App not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteApp(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    await this.appsService.delete(id, user.userId);
  }
}

/**
 * Public marketplace controller (no auth required)
 */
@ApiTags('marketplace')
@Controller('marketplace/apps')
export class MarketplaceController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse apps (Public - no auth required)' })
  @ApiResponse({ status: 200, description: 'Apps retrieved successfully' })
  async browseApps(@Query() query: AppQueryDto) {
    return this.appsService.browseApps(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get app details (Public - no auth required)' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ status: 200, description: 'App retrieved successfully' })
  @ApiResponse({ status: 404, description: 'App not found or not available' })
  async getAppDetails(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.getPublicAppDetails(id);
  }
}

