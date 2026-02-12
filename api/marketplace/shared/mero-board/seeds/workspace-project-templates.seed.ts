import { DataSource } from 'typeorm';
import { WorkspaceTemplate } from '../entities/workspace-template.entity';
import { WorkspaceTemplateProject } from '../entities/workspace-template-project.entity';
import { ProjectTemplate } from '../entities/project-template.entity';
import { ProjectTemplateTask } from '../entities/project-template-task.entity';
import { Organization } from '../../../../src/database/entities/organizations.entity';
import { User } from '../../../../src/database/entities/users.entity';
import { TaskStatus, TaskPriority } from '../../../../src/database/entities/tasks.entity';

/**
 * Seed workspace and project templates
 * Creates public templates that can be used by any organization
 */
export async function seedWorkspaceProjectTemplates(dataSource: DataSource): Promise<void> {
  const templateRepository = dataSource.getRepository(WorkspaceTemplate);
  const projectTemplateRepository = dataSource.getRepository(ProjectTemplate);
  const templateProjectRepository = dataSource.getRepository(WorkspaceTemplateProject);
  const templateTaskRepository = dataSource.getRepository(ProjectTemplateTask);
  const organizationRepository = dataSource.getRepository(Organization);
  const userRepository = dataSource.getRepository(User);

  // Get or create a system organization for templates
  let systemOrg = await organizationRepository.findOne({
    where: { slug: 'system' },
  });

  if (!systemOrg) {
    const organizations = await organizationRepository.find({
      order: { created_at: 'ASC' },
      take: 1,
    });
    systemOrg = organizations.length > 0 ? organizations[0] : null;
  }

  if (!systemOrg) {
    console.log('⚠️  No organization found. Seeding templates without organization.');
  }

  // Get or create a system user for templates
  let systemUser = await userRepository.findOne({
    where: { email: 'system@merojugx.com' },
  });

  if (!systemUser && systemOrg) {
    const orgMembers = systemOrg ? await dataSource
      .getRepository('organization_members')
      .findOne({
        where: { organization_id: systemOrg.id },
        order: { joined_at: 'ASC' },
      }) : null;

    if (orgMembers) {
      systemUser = await userRepository.findOne({
        where: { id: (orgMembers as any).user_id },
      });
    }
  }

  if (!systemUser) {
    console.log('⚠️  No user found. Seeding templates without creator.');
  }

  console.log('🌱 Seeding workspace and project templates...\n');

  // ========== PROJECT TEMPLATES ==========
  console.log('  Creating project templates...');

  // 1. Backlog Project
  let backlogPT = await projectTemplateRepository.findOne({ where: { name: 'Backlog Project', is_public: true } });
  if (!backlogPT) {
    backlogPT = await projectTemplateRepository.save(projectTemplateRepository.create({
      name: 'Backlog Project',
      description: 'A project template for managing a product backlog with user stories and features.',
      category: 'backlog',
      is_public: true,
      organization_id: systemOrg?.id || null,
      created_by: systemUser?.id || null,
    }));
    await templateTaskRepository.save([
      { template_id: backlogPT.id, title: 'Epic: User Authentication', status: TaskStatus.TODO, priority: TaskPriority.HIGH, sort_order: 0 },
      { template_id: backlogPT.id, title: 'User Story: Login Page', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, sort_order: 1 },
      { template_id: backlogPT.id, title: 'User Story: Registration', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, sort_order: 2 },
    ].map(t => templateTaskRepository.create(t)));
  }

  // 2. Scrum Sprint
  let scrumSprintPT = await projectTemplateRepository.findOne({ where: { name: 'Scrum Sprint', is_public: true } });
  if (!scrumSprintPT) {
    scrumSprintPT = await projectTemplateRepository.save(projectTemplateRepository.create({
      name: 'Scrum Sprint',
      description: 'Template for a 2-week sprint with sprint planning and reviews.',
      category: 'scrum',
      is_public: true,
      organization_id: systemOrg?.id || null,
      created_by: systemUser?.id || null,
    }));
    await templateTaskRepository.save([
      { template_id: scrumSprintPT.id, title: 'Sprint Planning Meeting', status: TaskStatus.TODO, priority: TaskPriority.HIGH, sort_order: 0 },
      { template_id: scrumSprintPT.id, title: 'Daily Standup', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, sort_order: 1 },
      { template_id: scrumSprintPT.id, title: 'Sprint Review', status: TaskStatus.TODO, priority: TaskPriority.HIGH, sort_order: 2 },
    ].map(t => templateTaskRepository.create(t)));
  }

  // 3. Kanban Board
  let kanbanPT = await projectTemplateRepository.findOne({ where: { name: 'Kanban Board', is_public: true } });
  if (!kanbanPT) {
    kanbanPT = await projectTemplateRepository.save(projectTemplateRepository.create({
      name: 'Kanban Board',
      description: 'A standard Kanban board template.',
      category: 'kanban',
      is_public: true,
      organization_id: systemOrg?.id || null,
      created_by: systemUser?.id || null,
    }));
    await templateTaskRepository.save([
      { template_id: kanbanPT.id, title: 'Backlog Item', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, sort_order: 0 },
      { template_id: kanbanPT.id, title: 'In Progress Task', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, sort_order: 1 },
    ].map(t => templateTaskRepository.create(t)));
  }

  // ========== WORKSPACE TEMPLATES ==========
  console.log('  Creating workspace templates...');

  // 1. Scrum Workspace
  let scrumWT = await templateRepository.findOne({ where: { name: 'Scrum Workspace', is_public: true } });
  if (!scrumWT) {
    scrumWT = await templateRepository.save(templateRepository.create({
      name: 'Scrum Workspace',
      description: 'Complete Scrum setup with Backlog and Sprints.',
      category: 'scrum',
      is_public: true,
      organization_id: systemOrg?.id || null,
      created_by: systemUser?.id || null,
    }));
    await templateProjectRepository.save([
      { template_id: scrumWT.id, name: 'Product Backlog', project_template_id: backlogPT.id, sort_order: 0 },
      { template_id: scrumWT.id, name: 'Active Sprint', project_template_id: scrumSprintPT.id, sort_order: 1 },
      { template_id: scrumWT.id, name: 'Sprint Review', project_template_id: scrumSprintPT.id, sort_order: 2 },
    ].map(p => templateProjectRepository.create(p)));
  }

  // 2. Kanban Workspace
  let kanbanWT = await templateRepository.findOne({ where: { name: 'Kanban Workspace', is_public: true } });
  if (!kanbanWT) {
    kanbanWT = await templateRepository.save(templateRepository.create({
      name: 'Kanban Workspace',
      description: 'Simple Kanban workflow.',
      category: 'kanban',
      is_public: true,
      organization_id: systemOrg?.id || null,
      created_by: systemUser?.id || null,
    }));
    await templateProjectRepository.save([
      { template_id: kanbanWT.id, name: 'Main Board', project_template_id: kanbanPT.id, sort_order: 0 },
    ].map(p => templateProjectRepository.create(p)));
  }

  console.log('\n✅ Workspace and project templates seeded successfully!\n');
}

