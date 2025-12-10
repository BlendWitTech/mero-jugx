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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CustomPermissionsService } from './custom-permissions.service';
import { TimeBasedPermissionsService } from './time-based-permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly customPermissionsService: CustomPermissionsService,
    private readonly timeBasedPermissionsService: TimeBasedPermissionsService,
  ) {}

  // Custom Permissions
  @Post('custom')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Create a custom permission' })
  @ApiResponse({ status: 201, description: 'Custom permission created successfully' })
  async createCustomPermission(
    @CurrentUser() user: any,
    @Body() dto: { name: string; slug: string; description?: string; category: string },
  ) {
    return this.customPermissionsService.createCustomPermission(
      user.organizationId,
      user.userId,
      dto.name,
      dto.slug,
      dto.description || null,
      dto.category,
    );
  }

  @Get('custom')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'List custom permissions' })
  @ApiResponse({ status: 200, description: 'Custom permissions retrieved successfully' })
  async listCustomPermissions(@CurrentUser() user: any) {
    return this.customPermissionsService.listCustomPermissions(user.organizationId, user.userId);
  }

  @Put('custom/:id')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Update a custom permission' })
  @ApiResponse({ status: 200, description: 'Custom permission updated successfully' })
  @ApiParam({ name: 'id', type: Number })
  async updateCustomPermission(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { name?: string; description?: string; category?: string; is_active?: boolean },
  ) {
    return this.customPermissionsService.updateCustomPermission(
      user.organizationId,
      user.userId,
      id,
      dto,
    );
  }

  @Delete('custom/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Delete a custom permission' })
  @ApiResponse({ status: 204, description: 'Custom permission deleted successfully' })
  @ApiParam({ name: 'id', type: Number })
  async deleteCustomPermission(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customPermissionsService.deleteCustomPermission(
      user.organizationId,
      user.userId,
      id,
    );
  }

  // Time-based Permissions
  @Post('time-based')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Grant a time-based permission to a role' })
  @ApiResponse({ status: 201, description: 'Time-based permission granted successfully' })
  async grantTimeBasedPermission(
    @CurrentUser() user: any,
    @Body() dto: {
      role_id: number;
      permission_id: number;
      starts_at: string;
      expires_at: string;
      reason?: string;
    },
  ) {
    return this.timeBasedPermissionsService.grantTimeBasedPermission(
      user.organizationId,
      user.userId,
      dto.role_id,
      dto.permission_id,
      new Date(dto.starts_at),
      new Date(dto.expires_at),
      dto.reason || null,
    );
  }

  @Get('time-based')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'List time-based permissions' })
  @ApiResponse({ status: 200, description: 'Time-based permissions retrieved successfully' })
  @ApiQuery({ name: 'role_id', required: false, type: Number })
  async listTimeBasedPermissions(
    @CurrentUser() user: any,
    @Query('role_id') roleId?: number,
  ) {
    return this.timeBasedPermissionsService.listTimeBasedPermissions(
      user.organizationId,
      user.userId,
      roleId,
    );
  }

  @Delete('time-based/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Revoke a time-based permission' })
  @ApiResponse({ status: 204, description: 'Time-based permission revoked successfully' })
  @ApiParam({ name: 'id', type: Number })
  async revokeTimeBasedPermission(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.timeBasedPermissionsService.revokeTimeBasedPermission(
      user.organizationId,
      user.userId,
      id,
    );
  }
}

