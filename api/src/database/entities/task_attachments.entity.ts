import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Task } from './tasks.entity';
import { User } from './users.entity';
import { Organization } from './organizations.entity';

@Entity('task_attachments')
@Index(['task_id'])
@Index(['uploaded_by'])
export class TaskAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    task_id: string;

    @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ name: 'organization_id', type: 'uuid' })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ type: 'varchar', length: 255 })
    file_name: string;

    @Column({ type: 'text' })
    file_url: string;

    @Column({ type: 'varchar', length: 50 })
    file_type: string;

    @Column({ type: 'int' })
    file_size: number;

    @Column({ type: 'text', nullable: true })
    thumbnail_url: string | null;

    @Column({ type: 'uuid' })
    uploaded_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by' })
    uploader: User;

    @CreateDateColumn()
    created_at: Date;
}
