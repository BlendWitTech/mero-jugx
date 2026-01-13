import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdminChatMessage } from './admin_chat_messages.entity';

@Entity('admin_chat_message_attachments')
@Index(['message_id'])
export class AdminChatMessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  message_id: string;

  @ManyToOne(() => AdminChatMessage, (message) => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: AdminChatMessage;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  file_type: string | null; // MIME type

  @Column({ type: 'bigint', nullable: true })
  file_size: number | null; // Size in bytes

  @CreateDateColumn()
  created_at: Date;
}

