import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../../../../../src/database/entities/organizations.entity';
import { User } from '../../../../../../src/database/entities/users.entity';
import { ProjectTemplateTask } from './project-template-task.entity';

@Entity('mero_board_project_templates')
@Index(['organization_id'])
@Index(['created_by'])
export class ProjectTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  organization_id: string | null;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'custom' })
  category: string; // 'custom', 'software', 'marketing', 'product', etc.

  @Column({ type: 'boolean', default: false })
  is_public: boolean; // If true, available to all organizations

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'int', default: 0 })
  usage_count: number; // How many times this template has been used

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => ProjectTemplateTask, (task) => task.template, { cascade: true })
  tasks: ProjectTemplateTask[];
}

