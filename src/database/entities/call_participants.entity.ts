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
import { CallSession } from './call_sessions.entity';
import { User } from './users.entity';

export enum CallParticipantStatus {
  INVITED = 'invited',
  RINGING = 'ringing',
  JOINED = 'joined',
  LEFT = 'left',
  DECLINED = 'declined',
  MISSED = 'missed',
}

@Entity('call_participants')
@Unique(['call_session_id', 'user_id'])
@Index(['call_session_id'])
@Index(['user_id'])
@Index(['status'])
export class CallParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  call_session_id: string;

  @ManyToOne(() => CallSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'call_session_id' })
  call_session: CallSession;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: CallParticipantStatus,
    default: CallParticipantStatus.INVITED,
  })
  status: CallParticipantStatus;

  @Column({ type: 'timestamp', nullable: true })
  joined_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  left_at: Date | null;

  @Column({ type: 'boolean', default: false })
  audio_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  video_enabled: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  webrtc_connection_id: string | null; // WebRTC connection identifier

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

