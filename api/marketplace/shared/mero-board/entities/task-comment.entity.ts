import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../../../../src/database/entities/tasks.entity';
import { User } from '../../../../src/database/entities/users.entity';

@Entity('mero_board_task_comments')
@Index(['task_id'])
@Index(['author_id'])
@Index(['created_at'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid' })
  author_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', nullable: true })
  parent_comment_id: string | null; // For threaded comments

  @ManyToOne(() => TaskComment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_comment_id' })
  parent_comment: TaskComment | null;

  @Column({ type: 'boolean', default: false })
  is_edited: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}


