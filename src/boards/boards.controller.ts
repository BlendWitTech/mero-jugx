import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateEpicDto } from './dto/create-epic.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { CreateTaskFromTicketDto } from '../tickets/dto/create-task-from-ticket.dto';

@ApiTags('Boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a board' })
  createBoard(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardsService.createBoard(userId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards' })
  getBoards(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
  ) {
    return this.boardsService.getBoards(userId, organizationId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a project' })
  createProject(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.boardsService.createProject(userId, organizationId, dto);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects' })
  getProjects(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Query('board_id') boardId?: string,
  ) {
    return this.boardsService.getProjects(userId, organizationId, boardId);
  }

  @Post('epics')
  @ApiOperation({ summary: 'Create an epic' })
  createEpic(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateEpicDto,
  ) {
    return this.boardsService.createEpic(userId, organizationId, dto);
  }

  @Get('epics')
  @ApiOperation({ summary: 'Get all epics' })
  getEpics(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Query('project_id') projectId?: string,
  ) {
    return this.boardsService.getEpics(userId, organizationId, projectId);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a task' })
  createTask(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.boardsService.createTask(userId, organizationId, dto);
  }

  @Post('tasks/from-ticket')
  @ApiOperation({ summary: 'Create a task from a ticket (flag to board)' })
  createTaskFromTicket(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateTaskFromTicketDto,
  ) {
    return this.boardsService.createTaskFromTicket(userId, organizationId, dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks' })
  getTasks(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Query('project_id') projectId?: string,
    @Query('epic_id') epicId?: string,
    @Req() request?: Request,
  ) {
    // Fallback: try to get organizationId from request.user if decorator returned null
    let finalOrganizationId = organizationId;
    if (!finalOrganizationId && request?.user) {
      const user = request.user as any;
      finalOrganizationId = user?.organizationId || user?.membership?.organization?.id;
      if (finalOrganizationId) {
        console.warn('[BoardsController] Organization ID recovered from request.user', { finalOrganizationId });
      } else {
        console.error('[BoardsController] Organization ID missing', {
          userId,
          hasUser: !!user,
          userKeys: user ? Object.keys(user) : [],
          userOrganizationId: user?.organizationId,
          userMembership: !!user?.membership,
          organizationFromMembership: user?.membership?.organization?.id,
        });
      }
    }
    return this.boardsService.getTasks(userId, finalOrganizationId, projectId, epicId);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  updateTask(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.boardsService.updateTask(userId, organizationId, taskId, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  deleteTask(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') taskId: string,
  ) {
    return this.boardsService.deleteTask(userId, organizationId, taskId);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update a project' })
  updateProject(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.boardsService.updateProject(userId, organizationId, projectId, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a project' })
  deleteProject(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') projectId: string,
  ) {
    return this.boardsService.deleteProject(userId, organizationId, projectId);
  }

  @Patch('epics/:id')
  @ApiOperation({ summary: 'Update an epic' })
  updateEpic(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') epicId: string,
    @Body() dto: UpdateEpicDto,
  ) {
    return this.boardsService.updateEpic(userId, organizationId, epicId, dto);
  }

  @Delete('epics/:id')
  @ApiOperation({ summary: 'Delete an epic' })
  deleteEpic(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') epicId: string,
  ) {
    return this.boardsService.deleteEpic(userId, organizationId, epicId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  getAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
  ) {
    return this.boardsService.getAnalytics(userId, organizationId);
  }
}

