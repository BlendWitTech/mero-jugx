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

@Entity('mero_board_task_attachments')
@Index(['task_id'])
@Index(['uploaded_by'])
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'varchar', length: 100 })
  file_type: string; // MIME type

  @Column({ type: 'bigint' })
  file_size: number; // Size in bytes

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'uuid' })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn()
  created_at: Date;
}

