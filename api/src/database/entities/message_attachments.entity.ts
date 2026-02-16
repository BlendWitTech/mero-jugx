import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './messages.entity';
import { Organization } from './organizations.entity';

@Entity('message_attachments')
@Index(['message_id'])
export class MessageAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  message_id: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'varchar', length: 100 })
  file_type: string; // MIME type

  @Column({ type: 'bigint' })
  file_size: number; // in bytes

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string | null; // For images/videos

  @CreateDateColumn()
  created_at: Date;
}

