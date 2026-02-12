import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../entities/workspace-member.entity';
import { User } from '../../../../src/database/entities/users.entity';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { WorkspaceQueryDto } from '../dto/workspace-query.dto';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createWorkspace(
    userId: string,
    organizationId: string,
    createDto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = this.workspaceRepository.create({
      ...createDto,
      organization_id: organizationId,
      created_by: userId,
      owner_id: createDto.owner_id || userId,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Add creator as owner
    await this.memberRepository.save({
      workspace_id: savedWorkspace.id,
      user_id: userId,
      role: WorkspaceRole.OWNER,
      invited_by: userId,
      is_active: true,
    });

    return this.workspaceRepository.findOne({
      where: { id: savedWorkspace.id },
      relations: ['creator', 'owner', 'members', 'members.user'],
    });
  }

  async getWorkspaces(
    userId: string,
    organizationId: string,
    query?: WorkspaceQueryDto,
  ): Promise<{ data: Workspace[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    // Get workspaces where user is a member
    const memberships = await this.memberRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      relations: ['workspace'],
    });

    const workspaceIds = memberships
      .map((m) => m.workspace_id)
      .filter((id) => id);

    // If user is not a member of any workspaces, return empty result
    if (workspaceIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const queryBuilder = this.workspaceRepository
      .createQueryBuilder('workspace')
      .where('workspace.id IN (:...workspaceIds)', { workspaceIds })
      .andWhere('workspace.organization_id = :organizationId', { organizationId })
      .andWhere('workspace.is_active = :isActive', { isActive: true })
      .leftJoinAndSelect('workspace.creator', 'creator')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .leftJoinAndSelect('workspace.members', 'members')
      .orderBy('workspace.sort_order', 'ASC')
      .addOrderBy('workspace.created_at', 'DESC');

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

  async getWorkspace(
    userId: string,
    organizationId: string,
    workspaceId: string,
  ): Promise<Workspace> {
    // Verify user is a member
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: {
        id: workspaceId,
        organization_id: organizationId,
      },
      relations: ['creator', 'owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async updateWorkspace(
    userId: string,
    organizationId: string,
    workspaceId: string,
    updateDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    // Verify user has permission (owner or admin)
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this workspace',
      );
    }

    await this.workspaceRepository.update(
      {
        id: workspaceId,
        organization_id: organizationId,
      },
      updateDto,
    );

    return this.getWorkspace(userId, organizationId, workspaceId);
  }

  async deleteWorkspace(
    userId: string,
    organizationId: string,
    workspaceId: string,
  ): Promise<void> {
    // Only owner can delete
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership || membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only the workspace owner can delete the workspace',
      );
    }

    await this.workspaceRepository.delete({
      id: workspaceId,
      organization_id: organizationId,
    });
  }

  async inviteMember(
    userId: string,
    organizationId: string,
    workspaceId: string,
    inviteDto: InviteMemberDto,
  ): Promise<WorkspaceMember> {
    // Verify user has permission (owner or admin)
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to invite members',
      );
    }

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: inviteDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: user.id,
      },
    });

    if (existingMember) {
      if (existingMember.is_active) {
        throw new ConflictException('User is already a member of this workspace');
      }
      // Reactivate if inactive
      existingMember.is_active = true;
      existingMember.role = inviteDto.role;
      return this.memberRepository.save(existingMember);
    }

    // Create new membership
    const newMember = this.memberRepository.create({
      workspace_id: workspaceId,
      user_id: user.id,
      role: inviteDto.role,
      invited_by: userId,
      is_active: true,
    });

    return this.memberRepository.save(newMember);
  }

  async updateMemberRole(
    userId: string,
    organizationId: string,
    workspaceId: string,
    memberId: string,
    updateDto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMember> {
    // Verify user has permission (owner or admin)
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update member roles',
      );
    }

    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        workspace_id: workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent changing owner role
    if (member.role === WorkspaceRole.OWNER && updateDto.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    member.role = updateDto.role;
    return this.memberRepository.save(member);
  }

  async removeMember(
    userId: string,
    organizationId: string,
    workspaceId: string,
    memberId: string,
  ): Promise<void> {
    // Verify user has permission (owner or admin)
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove members',
      );
    }

    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        workspace_id: workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing owner
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.memberRepository.remove(member);
  }

  async getWorkspaceMembers(
    userId: string,
    organizationId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember[]> {
    // Verify user is a member
    const membership = await this.memberRepository.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Get all active members with user relations
    return this.memberRepository.find({
      where: {
        workspace_id: workspaceId,
        is_active: true,
      },
      relations: ['user'],
      order: { joined_at: 'ASC' },
    });
  }
}


