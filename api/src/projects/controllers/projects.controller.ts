import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('apps/mero-board/projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
        return this.projectsService.create(createProjectDto, req.user.userId, req.user.organizationId);
    }

    @Get()
    findAll(@Request() req, @Query('workspaceId') workspaceId?: string) {
        return this.projectsService.findAll(req.user.organizationId, workspaceId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.projectsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
        return this.projectsService.update(id, updateProjectDto, req.user.organizationId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.projectsService.remove(id, req.user.organizationId);
    }
}
