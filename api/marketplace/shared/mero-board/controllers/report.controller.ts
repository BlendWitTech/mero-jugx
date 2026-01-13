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
import { JwtAuthGuard } from '../../../../../../src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../../../src/common/decorators/current-organization.decorator';

@ApiTags('mero-board-reports')
@Controller('apps/:appSlug')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('projects/:projectId/report')
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

