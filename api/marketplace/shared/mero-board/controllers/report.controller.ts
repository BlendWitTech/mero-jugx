import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { JwtAuthGuard } from '../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../src/common/decorators/permissions.decorator';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../src/common/decorators/current-organization.decorator';

@ApiTags('mero-board-reports')
@Controller('apps/:appSlug')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Get('projects/:projectId/report')
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get project report' })
  @ApiResponse({ status: 200, description: 'Project report retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getProjectReport(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
  ) {
    return this.reportService.getProjectReport(
      user.userId,
      organization.id,
      projectId,
    );
  }

  @Get('workspaces/:workspaceId/report')
  @Permissions('board.workspaces.view')
  @ApiOperation({ summary: 'Get workspace report' })
  @ApiResponse({ status: 200, description: 'Workspace report retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getWorkspaceReport(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.reportService.getWorkspaceReport(
      user.userId,
      organization.id,
      workspaceId,
    );
  }

  @Get('workspaces/:workspaceId/productivity')
  @Permissions('board.workspaces.view')
  @ApiOperation({ summary: 'Get team productivity report for workspace' })
  @ApiResponse({ status: 200, description: 'Productivity report retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getWorkspaceTeamProductivityReport(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getTeamProductivityReport(
      user.userId,
      organization.id,
      workspaceId,
      startDate,
      endDate,
      'workspace',
    );
  }

  @Get('projects/:projectId/productivity')
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get team productivity report for project' })
  @ApiResponse({ status: 200, description: 'Productivity report retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getProjectTeamProductivityReport(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getTeamProductivityReport(
      user.userId,
      organization.id,
      projectId,
      startDate,
      endDate,
      'project',
    );
  }
}


