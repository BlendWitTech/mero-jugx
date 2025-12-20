import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Ticket } from './tickets.entity';
import { User } from './users.entity';

export enum TicketActivityType {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  COMPLETED_ON_TIME = 'completed_on_time',
  COMPLETED_OUT_OF_TIME = 'completed_out_of_time',
  TRANSFERRED = 'transferred',
  ADDITIONAL_TIME_REQUESTED = 'additional_time_requested',
  ADDITIONAL_TIME_APPROVED = 'additional_time_approved',
  ADDITIONAL_TIME_DENIED = 'additional_time_denied',
  COMMENT_ADDED = 'comment_added',
  TAG_ADDED = 'tag_added',
  TAG_REMOVED = 'tag_removed',
}

@Entity('ticket_activities')
@Index(['ticket_id'])
@Index(['user_id'])
@Index(['activity_type'])
@Index(['created_at'])
export class TicketActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticket_id: string;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TicketActivityType,
  })
  activity_type: TicketActivityType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Store additional data like old_value, new_value, etc.

  @CreateDateColumn()
  created_at: Date;
}

