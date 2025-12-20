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
import { AdminChat } from './admin_chats.entity';
import { User } from './users.entity';
import { AdminChatMessageAttachment } from './admin_chat_message_attachments.entity';

export enum AdminChatMessageType {
  TEXT = 'text',
  SYSTEM = 'system', // System notifications
}

@Entity('admin_chat_messages')
@Index(['admin_chat_id'])
@Index(['sender_id'])
@Index(['created_at'])
export class AdminChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  admin_chat_id: string;

  @ManyToOne(() => AdminChat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_chat_id' })
  admin_chat: AdminChat;

  @Column({ type: 'uuid' })
  sender_id: string; // User or admin who sent the message

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({
    type: 'enum',
    enum: AdminChatMessageType,
    default: AdminChatMessageType.TEXT,
  })
  type: AdminChatMessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  is_from_admin: boolean; // true if sent by system admin, false if sent by organization user

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => AdminChatMessageAttachment, (attachment) => attachment.message)
  attachments: AdminChatMessageAttachment[];
}

