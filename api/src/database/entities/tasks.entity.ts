import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { Project } from './projects.entity';
import { Epic } from './epics.entity';
import { Ticket } from './tickets.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
@Index(['organization_id'])
@Index(['project_id'])
@Index(['epic_id'])
@Index(['assignee_id'])
@Index(['created_by'])
@Index(['status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'uuid', nullable: true })
  project_id: string | null;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ type: 'uuid', nullable: true })
  epic_id: string | null;

  @ManyToOne(() => Epic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'epic_id' })
  epic: Epic | null;

  @Column({ type: 'uuid', nullable: true })
  ticket_id: string | null; // Link to ticket if created from ticket

  @ManyToOne(() => Ticket, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 50, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  assignee_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  // Multiple assignees support
  @ManyToMany(() => User)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignees: User[];

  @Column({ type: 'date', nullable: true })
  due_date: Date | null;

  @Column({ type: 'int', nullable: true })
  estimated_hours: number | null;

  @Column({ type: 'int', nullable: true })
  actual_hours: number | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

