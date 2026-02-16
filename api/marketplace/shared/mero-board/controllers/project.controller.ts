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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectService } from '../services/project.service';
import { JwtAuthGuard } from '../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../src/common/decorators/permissions.decorator';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../src/common/decorators/current-organization.decorator';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';

@ApiTags('mero-board-projects')
@Controller('apps/:appSlug/projects')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Post()
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  async createProject(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() createDto: CreateProjectDto,
  ) {
    return this.projectService.createProject(
      user.userId,
      organization.id,
      createDto,
    );
  }

  @Get()
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Filter by workspace ID' })
  async getProjects(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Query('workspaceId') workspaceId?: string,
    @Query() query?: ProjectQueryDto,
  ) {
    return this.projectService.getProjects(
      user.userId,
      organization.id,
      workspaceId,
      query,
    );
  }

  @Get(':projectId')
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get a specific project' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProject(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectService.getProject(
      user.userId,
      organization.id,
      projectId,
    );
  }

  @Put(':projectId')
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async updateProject(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Body() updateDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(
      user.userId,
      organization.id,
      projectId,
      updateDto,
    );
  }

  @Delete(':projectId')
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete project' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async deleteProject(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
  ) {
    await this.projectService.deleteProject(
      user.userId,
      organization.id,
      projectId,
    );
  }
}


