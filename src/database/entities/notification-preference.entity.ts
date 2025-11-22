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
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum NotificationPreferenceScope {
  PERSONAL = 'personal', // Personal settings for the user
  ORGANIZATION = 'organization', // Organization-level settings (only for Organization Owner)
}

@Entity('notification_preferences')
@Unique(['user_id', 'organization_id', 'scope'])
@Index(['user_id'])
@Index(['organization_id'])
@Index(['scope'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  organization_id: string | null;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @Column({
    type: 'enum',
    enum: NotificationPreferenceScope,
    default: NotificationPreferenceScope.PERSONAL,
  })
  scope: NotificationPreferenceScope;

  @Column({ type: 'boolean', default: true })
  email_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  in_app_enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, { email: boolean; in_app: boolean }> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
