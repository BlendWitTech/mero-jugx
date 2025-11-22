import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum EmailVerificationType {
  REGISTRATION = 'registration',
  INVITATION = 'invitation',
  EMAIL_CHANGE = 'email_change',
  ORGANIZATION_EMAIL = 'organization_email',
}

@Entity('email_verifications')
@Index(['token'], { unique: true })
@Index(['user_id'])
@Index(['email'])
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: EmailVerificationType,
  })
  type: EmailVerificationType;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  // Helper method
  isExpired(): boolean {
    return new Date() > this.expires_at && this.verified_at === null;
  }

  isVerified(): boolean {
    return this.verified_at !== null;
  }
}
