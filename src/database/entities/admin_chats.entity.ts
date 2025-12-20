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
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { AdminChatMessage } from './admin_chat_messages.entity';

export enum AdminChatStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('admin_chats')
@Index(['organization_id'])
@Index(['user_id'])
@Index(['status'])
@Index(['created_at'])
export class AdminChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'uuid' })
  user_id: string; // Organization user who initiated the chat

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string | null; // System admin who is handling the chat

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User | null;

  @Column({
    type: 'enum',
    enum: AdminChatStatus,
    default: AdminChatStatus.OPEN,
  })
  status: AdminChatStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null; // Optional subject/title for the chat

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  last_message_id: string | null;

  @Column({ type: 'int', default: 0 })
  unread_count_user: number; // Unread messages for user

  @Column({ type: 'int', default: 0 })
  unread_count_admin: number; // Unread messages for admin

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => AdminChatMessage, (message) => message.admin_chat)
  messages: AdminChatMessage[];
}

