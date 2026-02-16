import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardProject } from '../../database/entities/board_projects.entity';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { OrganizationMember } from '../../database/entities/organization_members.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(BoardProject)
        private projectRepository: Repository<BoardProject>,
    ) { }

    async create(createProjectDto: CreateProjectDto, userId: string, organizationId: string): Promise<BoardProject> {
        const project = this.projectRepository.create({
            name: createProjectDto.name,
            description: createProjectDto.description,
            status: createProjectDto.status,
            workspaceId: createProjectDto.workspace_id,
            organizationId,
            createdById: userId,
        });
        return this.projectRepository.save(project);
    }

    async findAll(organizationId: string, workspaceId?: string): Promise<{ data: BoardProject[]; meta: any }> {
        const where: any = { organizationId };
        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        const projects = await this.projectRepository.find({
            where,
            relations: ['createdBy', 'workspace'],
            order: { createdAt: 'DESC' },
        });

        return {
            data: projects,
            meta: { total: projects.length },
        };
    }

    async findOne(id: string, organizationId: string): Promise<BoardProject> {
        const project = await this.projectRepository.findOne({
            where: { id, organizationId },
            relations: ['createdBy', 'workspace'],
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }
        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto, organizationId: string): Promise<BoardProject> {
        const project = await this.findOne(id, organizationId);
        Object.assign(project, updateProjectDto);
        return this.projectRepository.save(project);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.projectRepository.delete({ id, organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }
    }
}
