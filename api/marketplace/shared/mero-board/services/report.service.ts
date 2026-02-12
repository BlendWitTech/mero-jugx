import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../../../src/database/entities/projects.entity';
import { Task, TaskStatus } from '../../../../src/database/entities/tasks.entity';
import { TaskTimeLog } from '../entities/task-time-log.entity';
import { WorkspaceMember } from '../entities/workspace-member.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskTimeLog)
    private timeLogRepository: Repository<TaskTimeLog>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
  ) {}

  async getProjectReport(
    userId: string,
    organizationId: string,
    projectId: string,
  ): Promise<{
    project: Project;
    task_stats: {
      total: number;
      by_status: Record<TaskStatus, number>;
      by_priority: Record<string, number>;
      completed: number;
      completion_rate: number;
    };
    team_stats: {
      total_members: number;
      active_members: number;
    };
    time_stats: {
      total_minutes: number;
      total_hours: number;
      billable_hours: number;
    };
  }> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organization_id: organizationId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Load workspace members separately with user relations
    let workspaceMembers: WorkspaceMember[] = [];
    if (project.workspace_id) {
      workspaceMembers = await this.memberRepository.find({
        where: { workspace_id: project.workspace_id, is_active: true },
        relations: ['user'],
      });
    }

    // Get all tasks for the project
    const tasks = await this.taskRepository.find({
      where: { project_id: projectId, organization_id: organizationId },
    });

    // Task statistics
    const task_stats = {
      total: tasks.length,
      by_status: {
        [TaskStatus.TODO]: tasks.filter((t) => t.status === TaskStatus.TODO).length,
        [TaskStatus.IN_PROGRESS]: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
        [TaskStatus.IN_REVIEW]: tasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
        [TaskStatus.DONE]: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      },
      by_priority: {
        low: tasks.filter((t) => t.priority === 'low').length,
        medium: tasks.filter((t) => t.priority === 'medium').length,
        high: tasks.filter((t) => t.priority === 'high').length,
        urgent: tasks.filter((t) => t.priority === 'urgent').length,
      },
      completed: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      completion_rate: tasks.length > 0 ? (tasks.filter((t) => t.status === TaskStatus.DONE).length / tasks.length) * 100 : 0,
    };

    // Team statistics
    const team_stats = {
      total_members: workspaceMembers.length,
      active_members: workspaceMembers.length, // All loaded members are active
    };

    // Time statistics
    const timeLogs = await this.timeLogRepository
      .createQueryBuilder('log')
      .innerJoin('log.task', 'task')
      .where('task.project_id = :projectId', { projectId })
      .andWhere('task.organization_id = :organizationId', { organizationId })
      .getMany();

    const total_minutes = timeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
    const billable_minutes = timeLogs
      .filter((log) => log.is_billable)
      .reduce((sum, log) => sum + log.duration_minutes, 0);

    const time_stats = {
      total_minutes,
      total_hours: Math.round((total_minutes / 60) * 100) / 100,
      billable_hours: Math.round((billable_minutes / 60) * 100) / 100,
    };

    return {
      project,
      task_stats,
      team_stats,
      time_stats,
    };
  }

  async getWorkspaceReport(
    userId: string,
    organizationId: string,
    workspaceId: string,
  ): Promise<{
    workspace: any;
    project_stats: Array<{
      project_id: string;
      project_name: string;
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
    }>;
    overall_stats: {
      total_projects: number;
      total_tasks: number;
      completed_tasks: number;
      overall_completion_rate: number;
    };
  }> {
    // This would require workspace service - for now, return basic structure
    const projects = await this.projectRepository.find({
      where: { workspace_id: workspaceId, organization_id: organizationId },
    });

    const project_stats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskRepository.find({
          where: { project_id: project.id, organization_id: organizationId },
        });
        const completed = tasks.filter((t) => t.status === TaskStatus.DONE).length;
        return {
          project_id: project.id,
          project_name: project.name,
          total_tasks: tasks.length,
          completed_tasks: completed,
          completion_rate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
        };
      }),
    );

    const allTasks = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .where('project.workspace_id = :workspaceId', { workspaceId })
      .andWhere('task.organization_id = :organizationId', { organizationId })
      .getMany();

    const overall_stats = {
      total_projects: projects.length,
      total_tasks: allTasks.length,
      completed_tasks: allTasks.filter((t) => t.status === TaskStatus.DONE).length,
      overall_completion_rate: allTasks.length > 0 ? (allTasks.filter((t) => t.status === TaskStatus.DONE).length / allTasks.length) * 100 : 0,
    };

    return {
      workspace: { id: workspaceId },
      project_stats,
      overall_stats,
    };
  }

  async getTeamProductivityReport(
    userId: string,
    organizationId: string,
    id: string, // Can be workspaceId or projectId
    startDate?: string,
    endDate?: string,
    type: 'workspace' | 'project' = 'workspace',
  ): Promise<{
    team_members: Array<{
      user_id: string;
      user_name: string;
      tasks_assigned: number;
      tasks_completed: number;
      completion_rate: number;
      time_logged_minutes: number;
      time_logged_hours: number;
    }>;
  }> {
    let workspaceMembers: WorkspaceMember[] = [];
    let allTasks: Task[] = [];
    let timeLogsQuery;

    if (type === 'workspace') {
      // Load workspace members
      workspaceMembers = await this.memberRepository.find({
        where: { workspace_id: id, is_active: true },
        relations: ['user'],
      });

      // Get all tasks in workspace projects
      allTasks = await this.taskRepository
        .createQueryBuilder('task')
        .innerJoin('task.project', 'project')
        .where('project.workspace_id = :workspaceId', { workspaceId: id })
        .andWhere('task.organization_id = :organizationId', { organizationId })
        .getMany();

      // Get time logs for all tasks in workspace
      timeLogsQuery = this.timeLogRepository
        .createQueryBuilder('log')
        .innerJoin('log.task', 'task')
        .innerJoin('task.project', 'project')
        .where('project.workspace_id = :workspaceId', { workspaceId: id })
        .andWhere('task.organization_id = :organizationId', { organizationId });
    } else {
      // Project-based
      const project = await this.projectRepository.findOne({
        where: { id: id, organization_id: organizationId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Load workspace members
      if (project.workspace_id) {
        workspaceMembers = await this.memberRepository.find({
          where: { workspace_id: project.workspace_id, is_active: true },
          relations: ['user'],
        });
      }

      // Get all tasks for the project
      allTasks = await this.taskRepository.find({
        where: { project_id: id, organization_id: organizationId },
      });

      // Get time logs for all tasks in project
      timeLogsQuery = this.timeLogRepository
        .createQueryBuilder('log')
        .innerJoin('log.task', 'task')
        .where('task.project_id = :projectId', { projectId: id })
        .andWhere('task.organization_id = :organizationId', { organizationId });
    }

    if (startDate) {
      timeLogsQuery.andWhere('log.logged_date >= :startDate', { startDate });
    }
    if (endDate) {
      timeLogsQuery.andWhere('log.logged_date <= :endDate', { endDate });
    }

    const timeLogs = await timeLogsQuery.getMany();

    const team_members = workspaceMembers.map((member) => {
      const userTasks = allTasks.filter((t) => t.assignee_id === member.user_id);
      const completedTasks = userTasks.filter((t) => t.status === TaskStatus.DONE);
      const userTimeLogs = timeLogs.filter((log) => log.user_id === member.user_id);
      const totalMinutes = userTimeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);

      return {
        user_id: member.user_id,
        user_name: `${member.user.first_name} ${member.user.last_name}`,
        tasks_assigned: userTasks.length,
        tasks_completed: completedTasks.length,
        completion_rate: userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0,
        time_logged_minutes: totalMinutes,
        time_logged_hours: Math.round((totalMinutes / 60) * 100) / 100,
      };
    });

    return { team_members };
  }
}


