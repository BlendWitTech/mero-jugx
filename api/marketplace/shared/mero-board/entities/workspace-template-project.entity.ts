import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkspaceTemplate } from './workspace-template.entity';

@Entity('mero_board_workspace_template_projects')
@Index(['template_id'])
export class WorkspaceTemplateProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  template_id: string;

  @ManyToOne(() => WorkspaceTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: WorkspaceTemplate;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  sort_order: number; // Order within the template

  @Column({ type: 'uuid', nullable: true })
  project_template_id: string | null;

  @CreateDateColumn()
  created_at: Date;
}

