import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { MessageAttachment } from './message-attachment.entity';
import { MessageReaction } from './message-reaction.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system', // System messages like "User joined"
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
}

@Entity('messages')
@Index(['chat_id'])
@Index(['sender_id'])
@Index(['created_at'])
@Index(['status'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  chat_id: string;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column({ type: 'uuid' })
  @Index()
  sender_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({ type: 'uuid', nullable: true })
  reply_to_id: string | null; // For replying to messages

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  reply_to: Message | null;

  @Column({ type: 'boolean', default: false })
  is_edited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  edited_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Relations
  @OneToMany(() => MessageAttachment, (attachment) => attachment.message)
  attachments: MessageAttachment[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];
}

