import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { App } from './apps.entity';
import { User } from './users.entity';
import { OrganizationMember } from './organization_members.entity';
import { Role } from './roles.entity';

export enum AppInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('app_invitations')
@Index(['token'], { unique: true })
@Index(['organization_id', 'app_id', 'user_id'])
@Index(['status'])
@Index(['expires_at'])
export class AppInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int' })
  @Index()
  app_id: number;

  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  @Column({ type: 'int', nullable: true })
  role_id: number | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  user_id: string | null; // Organization member user ID (null for new users)

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  member_id: string | null; // Organization member ID (null for non-members)

  @ManyToOne(() => OrganizationMember, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: OrganizationMember | null;

  @Column({ type: 'uuid' })
  invited_by: string; // User who sent the invitation

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: AppInvitationStatus,
    default: AppInvitationStatus.PENDING,
  })
  status: AppInvitationStatus;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  declined_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  canceller: User | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Helper method
  isExpired(): boolean {
    return new Date() > this.expires_at && this.status === AppInvitationStatus.PENDING;
  }
}

