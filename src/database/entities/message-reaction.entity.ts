import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('message_reactions')
@Unique(['message_id', 'user_id', 'emoji'])
@Index(['message_id'])
@Index(['user_id'])
export class MessageReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  message_id: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  emoji: string; // e.g., '👍', '❤️', '😂'

  @CreateDateColumn()
  created_at: Date;
}

