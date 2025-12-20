import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board, BoardStatus } from '../database/entities/boards.entity';
import { Project, ProjectStatus } from '../database/entities/projects.entity';
import { Epic, EpicStatus } from '../database/entities/epics.entity';
import { Task, TaskStatus, TaskPriority } from '../database/entities/tasks.entity';
import { Ticket } from '../database/entities/tickets.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { UserAppAccess } from '../database/entities/user_app_access.entity';
import { App } from '../database/entities/apps.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateEpicDto } from './dto/create-epic.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { CreateTaskFromTicketDto } from '../tickets/dto/create-task-from-ticket.dto';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name);

  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(UserAppAccess)
    private appAccessRepository: Repository<UserAppAccess>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  /**
   * Check if user has access to mero-board app
   */
  private async hasAppAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      // Find mero-board app
      const meroBoardApp = await this.appRepository.findOne({
        where: { slug: 'mero-board' },
      });

      if (!meroBoardApp) {
        this.logger.warn('Mero Board app not found in database. Please ensure the app is seeded.');
        return false;
      }

      // Check if user has access
      const access = await this.appAccessRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          app_id: meroBoardApp.id,
          is_active: true,
        },
      });

      return !!access;
    } catch (error) {
      this.logger.error('Error checking app access:', error);
      return false;
    }
  }

  /**
   * Check if assignee has app access before assigning
   */
  private async validateAssigneeAccess(assigneeId: string, organizationId: string): Promise<void> {
    const hasAccess = await this.hasAppAccess(assigneeId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'User does not have access to Mero Board app. Please grant access first.',
      );
    }
  }

  // ========== BOARDS ==========

  async createBoard(userId: string, organizationId: string, dto: CreateBoardDto): Promise<Board> {
    // Check app access
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const board = this.boardRepository.create({
      organization_id: organizationId,
      created_by: userId,
      name: dto.name,
      description: dto.description,
      project_id: dto.project_id || null,
      status: BoardStatus.ACTIVE,
    });

    return this.boardRepository.save(board);
  }

  async getBoards(userId: string, organizationId: string): Promise<Board[]> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    return this.boardRepository.find({
      where: {
        organization_id: organizationId,
        status: BoardStatus.ACTIVE,
      },
      relations: ['project', 'creator'],
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
  }

  // ========== PROJECTS ==========

  async createProject(userId: string, organizationId: string, dto: CreateProjectDto): Promise<Project> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    // Validate assignee has access if provided
    if (dto.owner_id) {
      await this.validateAssigneeAccess(dto.owner_id, organizationId);
    }

    const project = this.projectRepository.create({
      organization_id: organizationId,
      created_by: userId,
      board_id: dto.board_id || null,
      name: dto.name,
      description: dto.description,
      owner_id: dto.owner_id || null,
      start_date: dto.start_date ? new Date(dto.start_date) : null,
      end_date: dto.end_date ? new Date(dto.end_date) : null,
      status: ProjectStatus.PLANNING,
    });

    return this.projectRepository.save(project);
  }

  async getProjects(userId: string, organizationId: string, boardId?: string): Promise<Project[]> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    try {
      // Use query builder to filter projects based on user access
      // User can see projects if they are:
      // 1. The owner of the project
      // 2. The creator of the project
      // 3. Have tasks assigned to them in the project
      const queryBuilder = this.projectRepository
        .createQueryBuilder('project')
        .leftJoinAndSelect('project.board', 'board')
        .leftJoinAndSelect('project.owner', 'owner')
        .leftJoinAndSelect('project.creator', 'creator')
        .leftJoin('project.tasks', 'task')
        .where('project.organization_id = :organizationId', { organizationId })
        .andWhere(
          '(project.owner_id = :userId OR project.created_by = :userId OR task.assignee_id = :userId)',
          { userId }
        )
        .groupBy('project.id')
        .addGroupBy('board.id')
        .addGroupBy('owner.id')
        .addGroupBy('creator.id')
        .orderBy('project.sort_order', 'ASC')
        .addOrderBy('project.created_at', 'DESC');

      if (boardId) {
        queryBuilder.andWhere('project.board_id = :boardId', { boardId });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error('Error fetching projects:', error);
      throw new BadRequestException('Failed to fetch projects. Please ensure the database is properly set up.');
    }
  }

  // ========== EPICS ==========

  async createEpic(userId: string, organizationId: string, dto: CreateEpicDto): Promise<Epic> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    // Validate project exists
    const project = await this.projectRepository.findOne({
      where: { id: dto.project_id, organization_id: organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate assignee has access if provided
    if (dto.assignee_id) {
      await this.validateAssigneeAccess(dto.assignee_id, organizationId);
    }

    const epic = this.epicRepository.create({
      organization_id: organizationId,
      project_id: dto.project_id,
      created_by: userId,
      name: dto.name,
      description: dto.description,
      assignee_id: dto.assignee_id || null,
      start_date: dto.start_date ? new Date(dto.start_date) : null,
      end_date: dto.end_date ? new Date(dto.end_date) : null,
      status: EpicStatus.PLANNING,
    });

    return this.epicRepository.save(epic);
  }

  async getEpics(userId: string, organizationId: string, projectId?: string): Promise<Epic[]> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    try {
      const where: any = {
        organization_id: organizationId,
      };

      if (projectId) {
        where.project_id = projectId;
      }

      return await this.epicRepository.find({
        where,
        relations: ['project', 'assignee', 'creator'],
        order: { sort_order: 'ASC', created_at: 'DESC' },
      });
    } catch (error) {
      console.error('Error fetching epics:', error);
      throw new BadRequestException('Failed to fetch epics. Please ensure the database is properly set up.');
    }
  }

  // ========== TASKS ==========

  async createTask(userId: string, organizationId: string, dto: CreateTaskDto): Promise<Task> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    // Validate project exists if provided
    if (dto.project_id) {
      const project = await this.projectRepository.findOne({
        where: { id: dto.project_id, organization_id: organizationId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    // Validate epic exists if provided
    if (dto.epic_id) {
      const epic = await this.epicRepository.findOne({
        where: { id: dto.epic_id, organization_id: organizationId },
      });

      if (!epic) {
        throw new NotFoundException('Epic not found');
      }
    }

    // Validate assignee has access if provided
    if (dto.assignee_id) {
      await this.validateAssigneeAccess(dto.assignee_id, organizationId);
    }

    // Validate multiple assignees have access
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      for (const assigneeId of dto.assignee_ids) {
        await this.validateAssigneeAccess(assigneeId, organizationId);
      }
    }

    const task = this.taskRepository.create({
      organization_id: organizationId,
      project_id: dto.project_id || null,
      epic_id: dto.epic_id || null,
      created_by: userId,
      title: dto.title,
      description: dto.description,
      assignee_id: dto.assignee_id || null,
      priority: dto.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      due_date: dto.due_date ? new Date(dto.due_date) : null,
      estimated_hours: dto.estimated_hours || null,
      tags: dto.tags || [],
    });

    const savedTask = await this.taskRepository.save(task);

    // Add multiple assignees if provided
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      // Note: This requires loading the task with relations to set assignees
      // For now, we'll use assignee_id for single assignee
      // Multiple assignees can be added via update
    }

    return savedTask;
  }

  /**
   * Create task from ticket (flag to board)
   */
  async createTaskFromTicket(
    userId: string,
    organizationId: string,
    dto: CreateTaskFromTicketDto,
  ): Promise<Task> {
    // Check app access
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    // Get ticket
    const ticket = await this.ticketRepository.findOne({
      where: { id: dto.ticket_id, organization_id: organizationId },
      relations: ['assignee', 'creator'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Validate project exists if provided
    if (dto.project_id) {
      const project = await this.projectRepository.findOne({
        where: { id: dto.project_id, organization_id: organizationId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    // Validate epic exists if provided
    if (dto.epic_id) {
      const epic = await this.epicRepository.findOne({
        where: { id: dto.epic_id, organization_id: organizationId },
      });

      if (!epic) {
        throw new NotFoundException('Epic not found');
      }
    }

    // Use ticket assignee if available, but validate they have app access
    let assigneeId = dto.ticket_id ? ticket.assignee_id : null;
    if (assigneeId) {
      try {
        await this.validateAssigneeAccess(assigneeId, organizationId);
      } catch {
        // If assignee doesn't have access, set to null (unassigned)
        assigneeId = null;
      }
    }

    // Map ticket priority to task priority
    const taskPriority = dto.priority || this.mapTicketPriorityToTaskPriority(ticket.priority);

    // Create task from ticket
    const task = this.taskRepository.create({
      organization_id: organizationId,
      project_id: dto.project_id || null,
      epic_id: dto.epic_id || null,
      ticket_id: dto.ticket_id,
      created_by: userId,
      title: ticket.title,
      description: ticket.description,
      assignee_id: assigneeId,
      priority: taskPriority,
      status: TaskStatus.TODO,
      due_date: ticket.due_date,
      estimated_hours: ticket.estimated_time_minutes
        ? Math.round(ticket.estimated_time_minutes / 60)
        : null,
      tags: ticket.tags || [],
    });

    const savedTask = await this.taskRepository.save(task);

    // Update ticket with board references
    ticket.board_app_id = await this.getMeroBoardAppId();
    ticket.board_id = dto.board_id || null;
    ticket.board_card_id = savedTask.id;
    await this.ticketRepository.save(ticket);

    return savedTask;
  }

  async getTasks(
    userId: string,
    organizationId: string,
    projectId?: string,
    epicId?: string,
  ): Promise<Task[]> {
    // Validate inputs with better error messages
    if (!organizationId) {
      this.logger.error('Organization ID is missing', { userId, projectId, epicId });
      throw new BadRequestException('Organization ID is required. Please ensure you are accessing the app within an organization context.');
    }
    
    if (!userId) {
      this.logger.error('User ID is missing', { organizationId, projectId, epicId });
      throw new BadRequestException('User ID is required. Please ensure you are authenticated.');
    }

    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    try {
      const where: any = {
        organization_id: organizationId,
      };

      if (projectId) {
        where.project_id = projectId;
      }

      if (epicId) {
        where.epic_id = epicId;
      }

      // Try to find tasks with relations, but handle missing relations gracefully
      // Use left joins to avoid errors if relations don't exist
      // Note: We don't join ticket here to avoid database schema issues - ticket relation can be loaded separately if needed
      // Filter tasks to only show those in projects the user has access to
      const queryBuilder = this.taskRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('task.epic', 'epic')
        .leftJoinAndSelect('task.assignee', 'assignee')
        .leftJoinAndSelect('task.creator', 'creator')
        // Removed ticket join to avoid database schema issues with estimated_time_minutes column
        // Ticket relation can be loaded separately if needed using task.ticket_id
        .where('task.organization_id = :organizationId', { organizationId })
        // Only show tasks from projects the user has access to (owner, creator, or has tasks)
        .andWhere(
          '(task.project_id IS NULL OR project.owner_id = :userId OR project.created_by = :userId OR task.assignee_id = :userId OR task.created_by = :userId)',
          { userId }
        );
      
      if (projectId) {
        // Verify user has access to this project
        const project = await this.projectRepository.findOne({
          where: { id: projectId, organization_id: organizationId },
        });
        
        if (project && (project.owner_id === userId || project.created_by === userId)) {
          // User is owner or creator, show all tasks
          queryBuilder.andWhere('task.project_id = :projectId', { projectId });
        } else {
          // User doesn't have direct access, check if they have tasks in this project
          queryBuilder.andWhere(
            '(task.project_id = :projectId AND (task.assignee_id = :userId OR task.created_by = :userId))',
            { projectId, userId }
          );
        }
      }
      
      if (epicId) {
        queryBuilder.andWhere('task.epic_id = :epicId', { epicId });
      }
      
      const tasks = await queryBuilder
        .orderBy('task.sort_order', 'ASC')
        .addOrderBy('task.created_at', 'DESC')
        .getMany();
      
      return tasks;
    } catch (error) {
      this.logger.error('Error fetching tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Error details:', { errorMessage, errorStack, organizationId, projectId, epicId });
      throw new BadRequestException(
        `Failed to fetch tasks: ${errorMessage}. Please ensure the database is properly set up.`,
      );
    }
  }

  async updateTask(
    userId: string,
    organizationId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, organization_id: organizationId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Validate assignee has access if provided
    if (dto.assignee_id && dto.assignee_id !== task.assignee_id) {
      await this.validateAssigneeAccess(dto.assignee_id, organizationId);
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assignee_id !== undefined) task.assignee_id = dto.assignee_id;
    if (dto.due_date !== undefined) task.due_date = dto.due_date ? new Date(dto.due_date) : null;
    if (dto.estimated_hours !== undefined) task.estimated_hours = dto.estimated_hours;
    if (dto.tags !== undefined) task.tags = dto.tags;

    return this.taskRepository.save(task);
  }

  private mapTicketPriorityToTaskPriority(ticketPriority: string): TaskPriority {
    switch (ticketPriority) {
      case 'urgent':
        return TaskPriority.URGENT;
      case 'high':
        return TaskPriority.HIGH;
      case 'medium':
        return TaskPriority.MEDIUM;
      case 'low':
        return TaskPriority.LOW;
      default:
        return TaskPriority.MEDIUM;
    }
  }

  private async getMeroBoardAppId(): Promise<number | null> {
    const app = await this.appRepository.findOne({
      where: { slug: 'mero-board' },
    });
    return app?.id || null;
  }

  // ========== DELETE OPERATIONS ==========

  async deleteTask(userId: string, organizationId: string, taskId: string): Promise<void> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, organization_id: organizationId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
  }

  async deleteProject(userId: string, organizationId: string, projectId: string): Promise<void> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organization_id: organizationId },
      relations: ['tasks'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project has tasks
    if (project.tasks && project.tasks.length > 0) {
      throw new BadRequestException('Cannot delete project with existing tasks. Please delete or reassign tasks first.');
    }

    await this.projectRepository.remove(project);
  }

  async deleteEpic(userId: string, organizationId: string, epicId: string): Promise<void> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const epic = await this.epicRepository.findOne({
      where: { id: epicId, organization_id: organizationId },
      relations: ['tasks'],
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    // Check if epic has tasks
    if (epic.tasks && epic.tasks.length > 0) {
      throw new BadRequestException('Cannot delete epic with existing tasks. Please delete or reassign tasks first.');
    }

    await this.epicRepository.remove(epic);
  }

  // ========== UPDATE OPERATIONS ==========

  async updateProject(userId: string, organizationId: string, projectId: string, dto: UpdateProjectDto): Promise<Project> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organization_id: organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate assignee has access if provided
    if (dto.owner_id && dto.owner_id !== project.owner_id) {
      await this.validateAssigneeAccess(dto.owner_id, organizationId);
    }

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.owner_id !== undefined) project.owner_id = dto.owner_id;
    if (dto.start_date !== undefined) project.start_date = dto.start_date ? new Date(dto.start_date) : null;
    if (dto.end_date !== undefined) project.end_date = dto.end_date ? new Date(dto.end_date) : null;

    return this.projectRepository.save(project);
  }

  async updateEpic(userId: string, organizationId: string, epicId: string, dto: UpdateEpicDto): Promise<Epic> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const epic = await this.epicRepository.findOne({
      where: { id: epicId, organization_id: organizationId },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    // Validate assignee has access if provided
    if (dto.assignee_id && dto.assignee_id !== epic.assignee_id) {
      await this.validateAssigneeAccess(dto.assignee_id, organizationId);
    }

    if (dto.name !== undefined) epic.name = dto.name;
    if (dto.description !== undefined) epic.description = dto.description;
    if (dto.assignee_id !== undefined) epic.assignee_id = dto.assignee_id;
    if (dto.start_date !== undefined) epic.start_date = dto.start_date ? new Date(dto.start_date) : null;
    if (dto.end_date !== undefined) epic.end_date = dto.end_date ? new Date(dto.end_date) : null;

    return this.epicRepository.save(epic);
  }

  // ========== ANALYTICS ==========

  async getAnalytics(userId: string, organizationId: string): Promise<any> {
    const hasAccess = await this.hasAppAccess(userId, organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to Mero Board app');
    }

    const [tasks, projects, epics] = await Promise.all([
      this.taskRepository.find({
        where: { organization_id: organizationId },
      }),
      this.projectRepository.find({
        where: { organization_id: organizationId },
      }),
      this.epicRepository.find({
        where: { organization_id: organizationId },
      }),
    ]);

    const now = new Date();
    const overdueTasks = tasks.filter(
      (task) => task.due_date && new Date(task.due_date) < now && task.status !== TaskStatus.DONE,
    );

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      in_progress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      in_review: tasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      overdue: overdueTasks.length,
    };

    const priorityStats = {
      urgent: tasks.filter((t) => t.priority === TaskPriority.URGENT).length,
      high: tasks.filter((t) => t.priority === TaskPriority.HIGH).length,
      medium: tasks.filter((t) => t.priority === TaskPriority.MEDIUM).length,
      low: tasks.filter((t) => t.priority === TaskPriority.LOW).length,
    };

    const completionRate = tasks.length > 0 ? (taskStats.done / tasks.length) * 100 : 0;

    return {
      taskStats,
      priorityStats,
      projectStats: {
        total: projects.length,
        active: projects.filter((p) => p.status === ProjectStatus.ACTIVE).length,
        completed: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
      },
      epicStats: {
        total: epics.length,
        active: epics.filter((e) => e.status === EpicStatus.IN_PROGRESS || e.status === EpicStatus.PLANNING).length,
        completed: epics.filter((e) => e.status === EpicStatus.COMPLETED).length,
      },
      completionRate: Math.round(completionRate * 100) / 100,
      overdueTasks: overdueTasks.length,
    };
  }
}

