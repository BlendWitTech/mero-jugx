import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardWorkspace } from '../../database/entities/board_workspaces.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dto/workspace.dto';
import { OrganizationMember } from '../../database/entities/organization_members.entity';

@Injectable()
export class WorkspacesService {
    constructor(
        @InjectRepository(BoardWorkspace)
        private workspaceRepository: Repository<BoardWorkspace>,
        @InjectRepository(OrganizationMember)
        private memberRepository: Repository<OrganizationMember>,
    ) { }

    async create(createWorkspaceDto: CreateWorkspaceDto, userId: string, organizationId: string): Promise<BoardWorkspace> {
        const workspace = this.workspaceRepository.create({
            ...createWorkspaceDto,
            organizationId,
            ownerId: userId,
        });
        return this.workspaceRepository.save(workspace);
    }

    async findAll(organizationId: string, userId: string): Promise<{ data: BoardWorkspace[]; meta: any }> {
        // TODO: Filter by membership when workspace members are implemented. 
        // For now, return all workspaces in the organization.
        const workspaces = await this.workspaceRepository.find({
            where: { organizationId },
            relations: ['owner'],
            order: { createdAt: 'DESC' },
        });

        return {
            data: workspaces,
            meta: { total: workspaces.length },
        };
    }

    async findOne(id: string, organizationId: string): Promise<BoardWorkspace> {
        const workspace = await this.workspaceRepository.findOne({
            where: { id, organizationId },
            relations: ['owner'],
        });

        if (!workspace) {
            throw new NotFoundException(`Workspace with ID ${id} not found`);
        }
        return workspace;
    }

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, organizationId: string): Promise<BoardWorkspace> {
        const workspace = await this.findOne(id, organizationId);
        Object.assign(workspace, updateWorkspaceDto);
        return this.workspaceRepository.save(workspace);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.workspaceRepository.delete({ id, organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Workspace with ID ${id} not found`);
        }
    }
}
