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
import { WorkspaceService } from '../services/workspace.service';
import { JwtAuthGuard } from '../../../../../../src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../../../src/common/decorators/current-organization.decorator';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { WorkspaceQueryDto } from '../dto/workspace-query.dto';

@ApiTags('mero-board-workspaces')
@Controller('apps/:appSlug/workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  async createWorkspace(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() createDto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(
      user.userId,
      organization.id,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved successfully' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  async getWorkspaces(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Query() query: WorkspaceQueryDto,
  ) {
    return this.workspaceService.getWorkspaces(user.userId, organization.id, query);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get a specific workspace' })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getWorkspace(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceService.getWorkspace(
      user.userId,
      organization.id,
      workspaceId,
    );
  }

  @Put(':workspaceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async updateWorkspace(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(
      user.userId,
      organization.id,
      workspaceId,
      updateDto,
    );
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 204, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete workspace' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async deleteWorkspace(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaceService.deleteWorkspace(
      user.userId,
      organization.id,
      workspaceId,
    );
  }

  @Post(':workspaceId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a member to workspace' })
  @ApiResponse({ status: 201, description: 'Member invited successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async inviteMember(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(
      user.userId,
      organization.id,
      workspaceId,
      inviteDto,
    );
  }

  @Put(':workspaceId/members/:memberId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async updateMemberRole(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.workspaceService.updateMemberRole(
      user.userId,
      organization.id,
      workspaceId,
      memberId,
      updateDto,
    );
  }

  @Get(':workspaceId/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all workspace members' })
  @ApiResponse({ status: 200, description: 'Workspace members retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getMembers(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceService.getWorkspaceMembers(
      user.userId,
      organization.id,
      workspaceId,
    );
  }

  @Delete(':workspaceId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from workspace' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'appSlug', description: 'App Slug' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async removeMember(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.workspaceService.removeMember(
      user.userId,
      organization.id,
      workspaceId,
      memberId,
    );
  }
}

