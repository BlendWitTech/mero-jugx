import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Task } from '../../../../../../src/database/entities/tasks.entity';

export enum TaskDependencyType {
  BLOCKS = 'blocks', // This task blocks the dependent task
  BLOCKED_BY = 'blocked_by', // This task is blocked by the dependent task
  RELATED = 'related', // Related tasks (no blocking relationship)
}

@Entity('mero_board_task_dependencies')
@Unique(['task_id', 'depends_on_task_id'])
@Index(['task_id'])
@Index(['depends_on_task_id'])
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'uuid' })
  depends_on_task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'depends_on_task_id' })
  depends_on_task: Task;

  @Column({
    type: 'enum',
    enum: TaskDependencyType,
    default: TaskDependencyType.BLOCKS,
  })
  dependency_type: TaskDependencyType;

  @CreateDateColumn()
  created_at: Date;
}

