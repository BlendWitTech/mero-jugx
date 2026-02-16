import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('apps/mero-board/projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(
        @Param('projectId') projectId: string,
        @Body() createTaskDto: CreateTaskDto,
        @Request() req
    ) {
        return this.tasksService.create(createTaskDto, projectId, req.user.userId, req.user.organizationId);
    }

    @Get()
    findAll(@Param('projectId') projectId: string, @Request() req) {
        return this.tasksService.findAll(projectId, req.user.organizationId);
    }

    @Get(':id')
    findOne(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Request() req
    ) {
        return this.tasksService.findOne(id, projectId, req.user.organizationId);
    }

    @Put(':id')
    update(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @Request() req
    ) {
        return this.tasksService.update(id, projectId, updateTaskDto, req.user.organizationId);
    }

    @Delete(':id')
    remove(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Request() req
    ) {
        return this.tasksService.remove(id, projectId, req.user.organizationId);
    }

    // Comments
    @Post(':id/comments')
    addComment(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Body() body: any, // Should be DTO
        @Request() req
    ) {
        return this.tasksService.addComment(id, projectId, req.user.userId, body, req.user.organizationId);
    }

    @Get(':id/comments')
    getComments(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Request() req
    ) {
        return this.tasksService.getComments(id, projectId, req.user.organizationId);
    }

    @Delete(':id/comments/:commentId')
    deleteComment(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Param('commentId') commentId: string,
        @Request() req
    ) {
        return this.tasksService.deleteComment(commentId, id, projectId, req.user.userId, req.user.organizationId);
    }

    // Attachments
    @Post(':id/attachments')
    addAttachment(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Body() body: any,
        @Request() req
    ) {
        return this.tasksService.addAttachment(id, projectId, req.user.userId, body, req.user.organizationId);
    }

    @Get(':id/attachments')
    getAttachments(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Request() req
    ) {
        return this.tasksService.getAttachments(id, projectId, req.user.organizationId);
    }

    @Delete(':id/attachments/:attachmentId')
    deleteAttachment(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
        @Param('attachmentId') attachmentId: string,
        @Request() req
    ) {
        return this.tasksService.deleteAttachment(attachmentId, id, projectId, req.user.organizationId);
    }
}
