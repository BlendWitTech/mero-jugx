import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Chat } from './chats.entity';
import { User } from './users.entity';

export enum ChatMemberRole {
  OWNER = 'owner', // Group creator
  ADMIN = 'admin', // Group admin
  MEMBER = 'member', // Regular member
}

export enum ChatMemberStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
}

@Entity('chat_members')
@Unique(['chat_id', 'user_id'])
@Index(['chat_id'])
@Index(['user_id'])
@Index(['status'])
export class ChatMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  chat_id: string;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ChatMemberRole,
    default: ChatMemberRole.MEMBER,
  })
  role: ChatMemberRole;

  @Column({
    type: 'enum',
    enum: ChatMemberStatus,
    default: ChatMemberStatus.ACTIVE,
  })
  status: ChatMemberStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_read_at: Date | null;

  @Column({ type: 'int', default: 0 })
  unread_count: number;

  @Column({ type: 'boolean', default: true })
  notifications_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

