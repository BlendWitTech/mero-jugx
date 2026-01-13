import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkspaceTemplate } from '../entities/workspace-template.entity';
import { WorkspaceTemplateProject } from '../entities/workspace-template-project.entity';
import { Workspace } from '../entities/workspace.entity';
import { Project } from '../../../../../../src/database/entities/projects.entity';
import { Task } from '../../../../../../src/database/entities/tasks.entity';
import { WorkspaceMember, WorkspaceRole } from '../entities/workspace-member.entity';
import { CreateWorkspaceTemplateDto } from '../dto/create-workspace-template.dto';
import { UseWorkspaceTemplateDto } from '../dto/use-workspace-template.dto';
import { ProjectTemplateService } from './project-template.service';

@Injectable()
export class WorkspaceTemplateService {
  private readonly logger = new Logger(WorkspaceTemplateService.name);

  constructor(
    @InjectRepository(WorkspaceTemplate)
    private templateRepository: Repository<WorkspaceTemplate>,
    @InjectRepository(WorkspaceTemplateProject)
    private templateProjectRepository: Repository<WorkspaceTemplateProject>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
    @Inject(forwardRef(() => ProjectTemplateService))
    private projectTemplateService: ProjectTemplateService,
    private dataSource: DataSource,
  ) { }

  async createTemplate(
    userId: string,
    organizationId: string,
    createDto: CreateWorkspaceTemplateDto,
  ): Promise<WorkspaceTemplate> {
    const template = this.templateRepository.create({
      ...createDto,
      organization_id: organizationId,
      created_by: userId,
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Create template projects if provided
    if (createDto.projects && createDto.projects.length > 0) {
      const templateProjects = createDto.projects.map((projectDto, index) =>
        this.templateProjectRepository.create({
          ...projectDto,
          template_id: savedTemplate.id,
          sort_order: projectDto.sort_order ?? index,
        }),
      );
      await this.templateProjectRepository.save(templateProjects);
    }

    return this.templateRepository.findOne({
      where: { id: savedTemplate.id },
      relations: ['creator', 'projects'],
    });
  }

  async getTemplates(
    userId: string,
    organizationId: string,
    includePublic: boolean = true,
  ): Promise<WorkspaceTemplate[]> {
    const query = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .leftJoinAndSelect('template.projects', 'tp')
      .where('template.organization_id = :organizationId', { organizationId });

    if (includePublic) {
      query.orWhere('template.is_public = :isPublic', { isPublic: true });
    }

    return query.orderBy('template.created_at', 'DESC').getMany();
  }

  async getTemplate(
    userId: string,
    organizationId: string,
    templateId: string,
  ): Promise<WorkspaceTemplate> {
    const template = await this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.creator', 'creator')
      .leftJoinAndSelect('template.projects', 'tp')
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
    useDto: UseWorkspaceTemplateDto,
  ): Promise<Workspace> {
    const template = await this.getTemplate(userId, organizationId, useDto.template_id);

    // Create workspace from template
    const workspace = this.workspaceRepository.create({
      name: useDto.workspace_name || template.name,
      description: template.description,
      organization_id: organizationId,
      created_by: userId,
      owner_id: userId,
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

    // Create projects from template projects and populate with tasks from matching project templates
    if (template.projects && template.projects.length > 0) {
      // Get all available project templates for matching
      const availableProjectTemplates = await this.projectTemplateService.getTemplates(
        userId,
        organizationId,
        true, // Include public templates
      );

      const createdProjects = [];

      for (const templateProject of template.projects) {
        // Create the project
        const project = this.projectRepository.create({
          name: templateProject.name,
          description: templateProject.description,
          workspace_id: savedWorkspace.id,
          organization_id: organizationId,
          created_by: userId,
          owner_id: userId,
        });
        const savedProject = await this.projectRepository.save(project);
        createdProjects.push(savedProject);

        // Try to find a matching project template
        const matchingTemplate = this.findMatchingProjectTemplate(
          templateProject,
          template.category,
          availableProjectTemplates,
        );

        // If a matching template is found, populate tasks
        if (matchingTemplate) {
          try {
            const projectTemplate = await this.projectTemplateService.getTemplate(
              userId,
              organizationId,
              matchingTemplate.id,
            );

            if (projectTemplate.tasks && projectTemplate.tasks.length > 0) {
              const tasks = projectTemplate.tasks.map((templateTask) =>
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
              this.logger.log(
                `Populated project "${savedProject.name}" with ${tasks.length} tasks from template "${projectTemplate.name}"`,
              );
            }
          } catch (error) {
            // If template access fails, just log and continue
            this.logger.warn(
              `Could not populate tasks for project "${savedProject.name}": ${error.message}`,
            );
          }
        }
      }
    }

    // Increment usage count
    template.usage_count += 1;
    await this.templateRepository.save(template);

    return this.workspaceRepository.findOne({
      where: { id: savedWorkspace.id },
      relations: ['creator', 'owner', 'members'],
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

  /**
   * Find a matching project template for a workspace template project
   * Uses intelligent matching based on name, category, and keywords
   */
  private findMatchingProjectTemplate(
    templateProject: WorkspaceTemplateProject,
    workspaceCategory: string,
    availableTemplates: any[],
  ): any | null {
    if (!availableTemplates || availableTemplates.length === 0) {
      return null;
    }

    // If explicit project_template_id is provided, use it
    if (templateProject.project_template_id) {
      const explicitMatch = availableTemplates.find(
        (t) => t.id === templateProject.project_template_id,
      );
      if (explicitMatch) {
        return explicitMatch;
      }
    }

    const projectName = templateProject.name.toLowerCase();

    // Define keyword mappings for better matching
    const keywordMappings: Record<string, string[]> = {
      'backlog': ['backlog', 'product backlog', 'sprint backlog'],
      'sprint': ['sprint', 'scrum sprint', 'sprint planning'],
      'kanban': ['kanban', 'kanban board'],
      'bug': ['bug', 'bug tracking', 'issues'],
      'feature': ['feature', 'feature development', 'new feature'],
      'content': ['content', 'content planning', 'content creation'],
      'event': ['event', 'event planning', 'webinar'],
    };

    // First, try exact name match
    let match = availableTemplates.find(
      (t) => t.name.toLowerCase() === projectName,
    );

    if (match) {
      return match;
    }

    // Try keyword-based matching
    for (const [keyword, variations] of Object.entries(keywordMappings)) {
      if (variations.some((v) => projectName.includes(v))) {
        match = availableTemplates.find(
          (t) =>
            t.category === keyword ||
            t.name.toLowerCase().includes(keyword) ||
            variations.some((v) => t.name.toLowerCase().includes(v)),
        );
        if (match) {
          return match;
        }
      }
    }

    // Try category-based matching
    const categoryMappings: Record<string, string[]> = {
      scrum: ['backlog', 'sprint'],
      kanban: ['kanban'],
      agile: ['backlog', 'sprint', 'feature'],
      marketing: ['content', 'event'],
      product: ['backlog', 'feature'],
    };

    if (workspaceCategory && categoryMappings[workspaceCategory]) {
      const preferredCategories = categoryMappings[workspaceCategory];
      match = availableTemplates.find((t) =>
        preferredCategories.includes(t.category),
      );
      if (match) {
        return match;
      }
    }

    // Try partial name matching
    match = availableTemplates.find((t) => {
      const templateName = t.name.toLowerCase();
      return (
        projectName.includes(templateName) ||
        templateName.includes(projectName) ||
        projectName.split(' ').some((word) => templateName.includes(word))
      );
    });

    return match || null;
  }
}

