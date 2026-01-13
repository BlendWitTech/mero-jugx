import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic, EpicStatus } from '../../../../../../src/database/entities/epics.entity';
import { Project } from '../../../../../../src/database/entities/projects.entity';
import { WorkspaceMember, WorkspaceRole } from '../entities/workspace-member.entity';
import { CreateEpicDto } from '../dto/create-epic.dto';
import { UpdateEpicDto } from '../dto/update-epic.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';

@Injectable()
export class EpicService {
  private readonly logger = new Logger(EpicService.name);

  constructor(
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
  ) {}

  async createEpic(
    userId: string,
    organizationId: string,
    projectId: string,
    createDto: CreateEpicDto,
  ): Promise<Epic> {
    // Verify project exists and user has access
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        organization_id: organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If project has a workspace, verify user is a member
    if (project.workspace_id) {
      const membership = await this.memberRepository.findOne({
        where: {
          workspace_id: project.workspace_id,
          user_id: userId,
          is_active: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }

    const epic = this.epicRepository.create({
      ...createDto,
      organization_id: organizationId,
      project_id: projectId,
      created_by: userId,
      status: createDto.status || EpicStatus.PLANNING,
      start_date: createDto.start_date ? new Date(createDto.start_date) : null,
      end_date: createDto.end_date ? new Date(createDto.end_date) : null,
    });

    return this.epicRepository.save(epic);
  }

  async getEpics(
    userId: string,
    organizationId: string,
    projectId: string,
    query?: ProjectQueryDto,
  ): Promise<{ data: Epic[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    // Verify project exists and user has access
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        organization_id: organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If project has a workspace, verify user is a member
    if (project.workspace_id) {
      const membership = await this.memberRepository.findOne({
        where: {
          workspace_id: project.workspace_id,
          user_id: userId,
          is_active: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.epicRepository
      .createQueryBuilder('epic')
      .where('epic.project_id = :projectId', { projectId })
      .andWhere('epic.organization_id = :organizationId', { organizationId })
      .leftJoinAndSelect('epic.creator', 'creator')
      .leftJoinAndSelect('epic.assignee', 'assignee')
      .orderBy('epic.sort_order', 'ASC')
      .addOrderBy('epic.created_at', 'DESC');

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEpic(
    userId: string,
    organizationId: string,
    projectId: string,
    epicId: string,
  ): Promise<Epic> {
    // Verify project exists and user has access
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        organization_id: organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If project has a workspace, verify user is a member
    if (project.workspace_id) {
      const membership = await this.memberRepository.findOne({
        where: {
          workspace_id: project.workspace_id,
          user_id: userId,
          is_active: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }

    const epic = await this.epicRepository.findOne({
      where: {
        id: epicId,
        project_id: projectId,
        organization_id: organizationId,
      },
      relations: ['creator', 'assignee', 'tasks'],
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    return epic;
  }

  async updateEpic(
    userId: string,
    organizationId: string,
    projectId: string,
    epicId: string,
    updateDto: UpdateEpicDto,
  ): Promise<Epic> {
    const epic = await this.getEpic(userId, organizationId, projectId, epicId);

    // Check if user has permission (creator or workspace admin/owner)
    if (epic.created_by !== userId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (project?.workspace_id) {
        const membership = await this.memberRepository.findOne({
          where: {
            workspace_id: project.workspace_id,
            user_id: userId,
            is_active: true,
          },
        });

        if (
          !membership ||
          (membership.role !== WorkspaceRole.OWNER &&
            membership.role !== WorkspaceRole.ADMIN)
        ) {
          throw new ForbiddenException(
            'You do not have permission to update this epic',
          );
        }
      } else {
        throw new ForbiddenException(
          'You do not have permission to update this epic',
        );
      }
    }

    if (updateDto.start_date) {
      epic.start_date = new Date(updateDto.start_date);
    }
    if (updateDto.end_date) {
      epic.end_date = new Date(updateDto.end_date);
    }

    Object.assign(epic, {
      ...updateDto,
      start_date: updateDto.start_date ? new Date(updateDto.start_date) : epic.start_date,
      end_date: updateDto.end_date ? new Date(updateDto.end_date) : epic.end_date,
    });

    return this.epicRepository.save(epic);
  }

  async deleteEpic(
    userId: string,
    organizationId: string,
    projectId: string,
    epicId: string,
  ): Promise<void> {
    const epic = await this.getEpic(userId, organizationId, projectId, epicId);

    // Check if user has permission (creator or workspace owner)
    if (epic.created_by !== userId) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (project?.workspace_id) {
        const membership = await this.memberRepository.findOne({
          where: {
            workspace_id: project.workspace_id,
            user_id: userId,
            is_active: true,
          },
        });

        if (!membership || membership.role !== WorkspaceRole.OWNER) {
          throw new ForbiddenException(
            'Only the epic creator or workspace owner can delete this epic',
          );
        }
      } else {
        throw new ForbiddenException(
          'Only the epic creator can delete this epic',
        );
      }
    }

    await this.epicRepository.remove(epic);
  }
}

