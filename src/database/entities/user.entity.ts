import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationMember } from './organization-member.entity';
import { Invitation } from './invitation.entity';
import { Session } from './session.entity';
import { EmailVerification } from './email-verification.entity';
import { Notification } from './notification.entity';
import { AuditLog } from './audit-log.entity';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['email_verified'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date | null;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_secret: string | null;

  @Column({ type: 'json', nullable: true })
  mfa_backup_codes: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  mfa_setup_completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Relations
  @OneToMany(() => OrganizationMember, (member) => member.user)
  organization_memberships: OrganizationMember[];

  @OneToMany(() => Invitation, (invitation) => invitation.user)
  invitations: Invitation[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => EmailVerification, (verification) => verification.user)
  email_verifications: EmailVerification[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  audit_logs: AuditLog[];

  // Helper methods
  get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
