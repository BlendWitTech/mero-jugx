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
import { Chat } from './chats.entity';
import { User } from './users.entity';
import { Organization } from './organizations.entity';
import { CallParticipant } from './call_participants.entity';

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

@Entity('call_sessions')
@Index(['chat_id'])
@Index(['initiated_by'])
@Index(['status'])
@Index(['created_at'])
export class CallSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  chat_id: string;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'uuid' })
  @Index()
  initiated_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiated_by' })
  initiator: User;

  @Column({
    type: 'enum',
    enum: CallType,
  })
  type: CallType;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.INITIATING,
  })
  status: CallStatus;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date | null;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null; // Duration in seconds

  @Column({ type: 'varchar', length: 500, nullable: true })
  webrtc_offer: string | null; // WebRTC offer SDP

  @Column({ type: 'varchar', length: 500, nullable: true })
  webrtc_answer: string | null; // WebRTC answer SDP

  @Column({ type: 'json', nullable: true })
  ice_candidates: any[] | null; // ICE candidates for WebRTC

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => CallParticipant, (participant) => participant.call_session)
  participants: CallParticipant[];
}

