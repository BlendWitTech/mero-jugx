import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WorkspacesService } from '../services/workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dto/workspace.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
// import { Permissions } from '../../common/decorators/permissions.decorator'; 

@Controller('apps/mero-board/workspaces')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    @Post()
    // @Permissions('board.workspaces.create') // TODO: Define permissions
    create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
        return this.workspacesService.create(createWorkspaceDto, req.user.userId, req.user.organizationId);
    }

    @Get()
    // @Permissions('board.workspaces.view')
    findAll(@Request() req) {
        return this.workspacesService.findAll(req.user.organizationId, req.user.userId);
    }

    @Get(':id')
    // @Permissions('board.workspaces.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.workspacesService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    // @Permissions('board.workspaces.update')
    update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto, @Request() req) {
        return this.workspacesService.update(id, updateWorkspaceDto, req.user.organizationId);
    }

    @Delete(':id')
    // @Permissions('board.workspaces.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.workspacesService.remove(id, req.user.organizationId);
    }
}
