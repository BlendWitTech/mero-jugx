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
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { ChatMember } from './chat-member.entity';
import { Message } from './message.entity';

export enum ChatType {
  DIRECT = 'direct', // One-on-one chat
  GROUP = 'group', // Group chat
}

export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('chats')
@Index(['organization_id'])
@Index(['type'])
@Index(['status'])
@Index(['created_by'])
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: ChatType,
  })
  type: ChatType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null; // For group chats

  @Column({ type: 'text', nullable: true })
  description: string | null; // For group chats

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null; // For group chats

  @Column({ type: 'uuid' })
  @Index()
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({
    type: 'enum',
    enum: ChatStatus,
    default: ChatStatus.ACTIVE,
  })
  status: ChatStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  last_message_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => ChatMember, (member) => member.chat)
  members: ChatMember[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}

