import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../database/entities/tasks.entity';
import { TaskComment } from '../../database/entities/task_comments.entity';
import { TaskAttachment } from '../../database/entities/task_attachments.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { AddCommentDto } from '../dto/add-comment.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(TaskComment)
        private commentRepository: Repository<TaskComment>,
        @InjectRepository(TaskAttachment)
        private attachmentRepository: Repository<TaskAttachment>,
    ) { }

    async create(createTaskDto: CreateTaskDto, projectId: string, userId: string, organizationId: string): Promise<Task> {
        const task = this.taskRepository.create({
            ...createTaskDto,
            project_id: projectId,
            organization_id: organizationId,
            created_by: userId,
        });
        return this.taskRepository.save(task);
    }

    async findAll(projectId: string, organizationId: string): Promise<{ data: Task[]; meta: any }> {
        const tasks = await this.taskRepository.find({
            where: { project_id: projectId, organization_id: organizationId },
            relations: ['assignee', 'creator'],
            order: { created_at: 'DESC' },
        });

        return {
            data: tasks,
            meta: { total: tasks.length },
        };
    }

    async findOne(id: string, projectId: string, organizationId: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id, project_id: projectId, organization_id: organizationId },
            relations: ['assignee', 'creator', 'tags'],
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }

    async update(id: string, projectId: string, updateTaskDto: UpdateTaskDto, organizationId: string): Promise<Task> {
        const task = await this.findOne(id, projectId, organizationId);
        Object.assign(task, updateTaskDto);
        return this.taskRepository.save(task);
    }

    async remove(id: string, projectId: string, organizationId: string): Promise<void> {
        const result = await this.taskRepository.delete({ id, project_id: projectId, organization_id: organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
    }

    // Comments
    async addComment(taskId: string, projectId: string, userId: string, dto: AddCommentDto, organizationId: string): Promise<TaskComment> {
        await this.findOne(taskId, projectId, organizationId); // Verify task exists and access
        const comment = this.commentRepository.create({
            ...dto,
            task_id: taskId,
            created_by: userId,
        });
        return this.commentRepository.save(comment);
    }

    async getComments(taskId: string, projectId: string, organizationId: string): Promise<{ data: TaskComment[]; meta: any }> {
        await this.findOne(taskId, projectId, organizationId);
        const comments = await this.commentRepository.find({
            where: { task_id: taskId },
            relations: ['author', 'parent_comment'],
            order: { created_at: 'ASC' },
        });
        return { data: comments, meta: { total: comments.length } };
    }

    async deleteComment(commentId: string, taskId: string, projectId: string, userId: string, organizationId: string): Promise<void> {
        await this.findOne(taskId, projectId, organizationId);
        const comment = await this.commentRepository.findOne({ where: { id: commentId, task_id: taskId } });
        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.created_by !== userId) throw new ForbiddenException('Cannot delete comment created by another user');

        await this.commentRepository.remove(comment);
    }

    // Attachments - Simplified for now, assuming file upload returns URL
    async addAttachment(taskId: string, projectId: string, userId: string, fileData: any, organizationId: string): Promise<TaskAttachment> {
        await this.findOne(taskId, projectId, organizationId);
        const attachment = this.attachmentRepository.create({
            ...fileData,
            task_id: taskId,
            uploaded_by: userId,
        });
        const saved = await this.attachmentRepository.save(attachment);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async getAttachments(taskId: string, projectId: string, organizationId: string): Promise<TaskAttachment[]> {
        await this.findOne(taskId, projectId, organizationId);
        return this.attachmentRepository.find({
            where: { task_id: taskId },
            relations: ['uploader'],
            order: { created_at: 'DESC' },
        });
    }

    async deleteAttachment(attachmentId: string, taskId: string, projectId: string, organizationId: string): Promise<void> {
        await this.findOne(taskId, projectId, organizationId);
        const result = await this.attachmentRepository.delete({ id: attachmentId, task_id: taskId });
        if (result.affected === 0) throw new NotFoundException('Attachment not found');
    }
}
