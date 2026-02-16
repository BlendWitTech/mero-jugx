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
import { Task } from './tasks.entity';
import { User } from './users.entity';

@Entity('task_comments')
@Index(['task_id'])
@Index(['created_by'])
export class TaskComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'uuid' })
    task_id: string;

    @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ type: 'uuid' })
    created_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    author: User;

    @Column({ type: 'uuid', nullable: true })
    parent_comment_id: string | null;

    @ManyToOne(() => TaskComment, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_comment_id' })
    parent_comment: TaskComment | null;

    @Column({ type: 'boolean', default: false })
    is_edited: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
