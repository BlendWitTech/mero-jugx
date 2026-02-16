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
} from '@nestjs/swagger';
import { EpicService } from '../services/epic.service';
import { JwtAuthGuard } from '../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../src/common/decorators/permissions.decorator';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../src/common/decorators/current-organization.decorator';
import { CreateEpicDto } from '../dto/create-epic.dto';
import { UpdateEpicDto } from '../dto/update-epic.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';

@ApiTags('mero-board-epics')
@Controller('apps/:appSlug/projects/:projectId/epics')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@ApiBearerAuth()
export class EpicController {
  constructor(private readonly epicService: EpicService) { }

  @Post()
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new epic' })
  @ApiResponse({ status: 201, description: 'Epic created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async createEpic(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Body() createDto: CreateEpicDto,
  ) {
    return this.epicService.createEpic(
      user.userId,
      organization.id,
      projectId,
      createDto,
    );
  }

  @Get()
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get all epics for a project' })
  @ApiResponse({ status: 200, description: 'Epics retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getEpics(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Query() query?: ProjectQueryDto,
  ) {
    return this.epicService.getEpics(
      user.userId,
      organization.id,
      projectId,
      query,
    );
  }

  @Get(':epicId')
  @Permissions('board.projects.view')
  @ApiOperation({ summary: 'Get a specific epic' })
  @ApiResponse({ status: 200, description: 'Epic retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'epicId', description: 'Epic ID' })
  async getEpic(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
  ) {
    return this.epicService.getEpic(
      user.userId,
      organization.id,
      projectId,
      epicId,
    );
  }

  @Put(':epicId')
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an epic' })
  @ApiResponse({ status: 200, description: 'Epic updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'epicId', description: 'Epic ID' })
  async updateEpic(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
    @Body() updateDto: UpdateEpicDto,
  ) {
    return this.epicService.updateEpic(
      user.userId,
      organization.id,
      projectId,
      epicId,
      updateDto,
    );
  }

  @Delete(':epicId')
  @Permissions('board.projects.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an epic' })
  @ApiResponse({ status: 204, description: 'Epic deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only creator or workspace owner can delete epic' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'epicId', description: 'Epic ID' })
  async deleteEpic(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('projectId') projectId: string,
    @Param('epicId') epicId: string,
  ) {
    await this.epicService.deleteEpic(
      user.userId,
      organization.id,
      projectId,
      epicId,
    );
  }
}


