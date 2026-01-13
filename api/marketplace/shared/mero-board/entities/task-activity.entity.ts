import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../../../../../../src/database/entities/tasks.entity';
import { User } from '../../../../../../src/database/entities/users.entity';

export enum TaskActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  DUE_DATE_SET = 'due_date_set',
  DUE_DATE_CHANGED = 'due_date_changed',
  DUE_DATE_REMOVED = 'due_date_removed',
  COMMENT_ADDED = 'comment_added',
  COMMENT_EDITED = 'comment_edited',
  COMMENT_DELETED = 'comment_deleted',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  TAG_ADDED = 'tag_added',
  TAG_REMOVED = 'tag_removed',
  DELETED = 'deleted',
}

@Entity('mero_board_task_activities')
@Index(['task_id'])
@Index(['user_id'])
@Index(['activity_type'])
@Index(['created_at'])
export class TaskActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TaskActivityType,
  })
  activity_type: TaskActivityType;

  @Column({ type: 'jsonb', nullable: true })
  old_value: any | null; // Previous value for changes

  @Column({ type: 'jsonb', nullable: true })
  new_value: any | null; // New value for changes

  @Column({ type: 'text', nullable: true })
  description: string | null; // Human-readable description

  @Column({ type: 'uuid', nullable: true })
  related_comment_id: string | null; // If activity is related to a comment

  @Column({ type: 'uuid', nullable: true })
  related_attachment_id: string | null; // If activity is related to an attachment

  @CreateDateColumn()
  created_at: Date;
}

