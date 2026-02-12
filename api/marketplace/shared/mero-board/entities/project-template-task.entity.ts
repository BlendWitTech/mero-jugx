import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectTemplate } from './project-template.entity';
import { TaskStatus, TaskPriority } from '../../../../src/database/entities/tasks.entity';

@Entity('mero_board_project_template_tasks')
@Index(['template_id'])
export class ProjectTemplateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  template_id: string;

  @ManyToOne(() => ProjectTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'int', default: 0 })
  sort_order: number; // Order within the template

  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  @CreateDateColumn()
  created_at: Date;
}


