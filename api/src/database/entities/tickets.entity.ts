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
import { Chat } from './chats.entity';
import { Message } from './messages.entity';
import { TicketComment } from './ticket_comments.entity';
import { App } from './apps.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketSource {
  REGULAR = 'regular',
  CHAT_FLAG = 'chat_flag',
  ADMIN_CHAT = 'admin_chat',
}

@Entity('tickets')
@Index(['organization_id'])
@Index(['status'])
@Index(['priority'])
@Index(['assignee_id'])
@Index(['created_by'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  assignee_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketSource, default: TicketSource.REGULAR })
  source: TicketSource;

  @Column({ type: 'uuid', nullable: true })
  chat_id: string | null;

  @ManyToOne(() => Chat, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat | null;

  @Column({ type: 'uuid', nullable: true })
  message_id: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'message_id' })
  message: Message | null;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  attachment_urls: string[] | null;

  @Column({ type: 'int', nullable: true })
  board_app_id: number | null; // App ID (e.g., Mero-board)

  @ManyToOne(() => App, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'board_app_id' })
  board_app: App | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  board_id: string | null; // Board ID within the app

  @Column({ type: 'varchar', length: 255, nullable: true })
  board_card_id: string | null; // Card ID within the board

  // Time tracking fields
  @Column({ type: 'int', nullable: true })
  estimated_time_minutes: number | null; // Estimated time to complete in minutes

  @Column({ type: 'int', nullable: true })
  actual_time_minutes: number | null; // Actual time taken in minutes

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date | null; // Expected completion date

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null; // Actual completion date

  @Column({ type: 'int', nullable: true })
  additional_time_requested_minutes: number | null; // Additional time requested in minutes

  @Column({ type: 'uuid', nullable: true })
  transferred_from_user_id: string | null; // User who transferred this ticket

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'transferred_from_user_id' })
  transferred_from_user: User | null;

  @Column({ type: 'uuid', nullable: true })
  transferred_to_user_id: string | null; // User this ticket was transferred to

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'transferred_to_user_id' })
  transferred_to_user: User | null;

  @Column({ type: 'timestamp', nullable: true })
  transferred_at: Date | null; // When the ticket was transferred

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TicketComment, (comment) => comment.ticket)
  comments: TicketComment[];
}

