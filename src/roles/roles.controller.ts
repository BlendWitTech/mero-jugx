import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'List organization roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRoles(@CurrentUser() user: any) {
    return this.rolesService.getRoles(user.userId, user.organizationId);
  }

  @Get('permissions')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get('usage-counts')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get user counts per role' })
  @ApiResponse({ status: 200, description: 'Role usage counts retrieved successfully' })
  async getRoleUsageCounts(@CurrentUser() user: any) {
    return this.rolesService.getRoleUsageCounts(user.userId, user.organizationId);
  }

  @Get(':id')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) roleId: number,
  ) {
    return this.rolesService.getRoleById(user.userId, user.organizationId, roleId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Role slug already exists' })
  async createRole(
    @CurrentUser() user: any,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(user.userId, user.organizationId, dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('roles.edit')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'System roles cannot be modified' })
  async updateRole(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(user.userId, user.organizationId, roleId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role or role assigned to users' })
  async deleteRole(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) roleId: number,
  ) {
    return this.rolesService.deleteRole(user.userId, user.organizationId, roleId);
  }
}


