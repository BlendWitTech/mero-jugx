import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProjectTemplate } from '../entities/project-template.entity';
import { ProjectTemplateTask } from '../entities/project-template-task.entity';
import { Project } from '../../../../src/database/entities/projects.entity';
import { Task } from '../../../../src/database/entities/tasks.entity';
import { CreateProjectTemplateDto } from '../dto/create-project-template.dto';
import { UseProjectTemplateDto } from '../dto/use-project-template.dto';

@Injectable()
export class ProjectTemplateService {
  private readonly logger = new Logger(ProjectTemplateService.name);

  constructor(
    @InjectRepository(ProjectTemplate)
    private templateRepository: Repository<ProjectTemplate>,
    @InjectRepository(ProjectTemplateTask)
    private templateTaskRepository: Repository<ProjectTemplateTask>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private dataSource: DataSource,
  ) {}

  async createTemplate(
    userId: string,
    organizationId: string,
    createDto: CreateProjectTemplateDto,
  ): Promise<ProjectTemplate> {
    const template = this.templateRepository.create({
      ...createDto,
      organization_id: organizationId,
      created_by: userId,
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Create template tasks if provided
    if (createDto.tasks && createDto.tasks.length > 0) {
      const templateTasks = createDto.tasks.map((taskDto, index) =>
        this.templateTaskRepository.create({
          ...taskDto,
          template_id: savedTemplate.id,
          sort_order: taskDto.sort_order ?? index,
        }),
      );
      await this.templateTaskRepository.save(templateTasks);
    }

    return this.templateRepository.findOne({
      where: { id: savedTemplate.id },
      relations: ['creator', 'tasks'],
    });
  }

  async getTemplates(
    userId: string,
    organizationId: string,
    includePublic: boolean = true,
  ): Promise<ProjectTemplate[]> {
    const where: any[] = [
      { organization_id: organizationId },
    ];

    if (includePublic) {
      where.push({ is_public: true });
    }

    return this.templateRepository.find({
      where,
      relations: ['creator', 'tasks'],
      order: { created_at: 'DESC' },
    });
  }

  async getTemplate(
    userId: string,
    organizationId: string,
    templateId: string,
  ): Promise<ProjectTemplate> {
    const template = await this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .leftJoinAndSelect('template.tasks', 'tasks')
      .where('template.id = :templateId', { templateId })
      .andWhere(
        '(template.organization_id = :organizationId OR template.is_public = :isPublic)',
        { organizationId, isPublic: true },
      )
      .getOne();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Verify access
    if (template.organization_id !== organizationId && !template.is_public) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async useTemplate(
    userId: string,
    organizationId: string,
    useDto: UseProjectTemplateDto,
  ): Promise<Project> {
    const template = await this.getTemplate(userId, organizationId, useDto.template_id);

    // Create project from template
    const project = this.projectRepository.create({
      name: useDto.project_name || template.name,
      description: template.description,
      workspace_id: useDto.workspace_id,
      organization_id: organizationId,
      created_by: userId,
      owner_id: userId,
    });

    const savedProject = await this.projectRepository.save(project);

    // Create tasks from template tasks
    if (template.tasks && template.tasks.length > 0) {
      const tasks = template.tasks.map((templateTask) =>
        this.taskRepository.create({
          title: templateTask.title,
          description: templateTask.description,
          status: templateTask.status,
          priority: templateTask.priority,
          project_id: savedProject.id,
          organization_id: organizationId,
          created_by: userId,
          tags: templateTask.tags,
        }),
      );
      await this.taskRepository.save(tasks);
    }

    // Increment usage count
    template.usage_count += 1;
    await this.templateRepository.save(template);

    return this.projectRepository.findOne({
      where: { id: savedProject.id },
      relations: ['creator', 'owner'],
    });
  }

  async deleteTemplate(
    userId: string,
    organizationId: string,
    templateId: string,
  ): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: {
        id: templateId,
        organization_id: organizationId,
        created_by: userId,
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found or you do not have permission to delete it');
    }

    await this.templateRepository.remove(template);
  }
}


