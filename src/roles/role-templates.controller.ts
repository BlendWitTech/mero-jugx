import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { RoleTemplatesService } from './role-templates.service';
import { CreateRoleFromTemplateDto } from './dto/create-role-from-template.dto';
import { RoleTemplate } from '../database/entities/role-template.entity';
import { Role } from '../database/entities/role.entity';

@ApiTags('role-templates')
@Controller('role-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RoleTemplatesController {
  constructor(private readonly roleTemplatesService: RoleTemplatesService) {}

  @Get()
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role templates for organization package' })
  @ApiResponse({
    status: 200,
    description: 'Role templates retrieved successfully',
    type: [RoleTemplate],
  })
  async getRoleTemplates(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<RoleTemplate[]> {
    return this.roleTemplatesService.getRoleTemplates(user.userId, organization.id);
  }

  @Get(':id')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get role template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Role template retrieved successfully',
    type: RoleTemplate,
  })
  async getRoleTemplateById(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id', ParseIntPipe) templateId: number,
  ): Promise<RoleTemplate> {
    return this.roleTemplatesService.getRoleTemplateById(user.userId, organization.id, templateId);
  }

  @Post('create-role')
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create a role from a template' })
  @ApiResponse({ status: 201, description: 'Role created successfully from template', type: Role })
  async createRoleFromTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Body() dto: CreateRoleFromTemplateDto,
  ): Promise<Role> {
    return this.roleTemplatesService.createRoleFromTemplate(user.userId, organization.id, dto);
  }
}
