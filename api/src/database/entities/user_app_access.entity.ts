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
import { User } from './users.entity';
import { Organization } from './organizations.entity';
import { App } from './apps.entity';
import { OrganizationMember } from './organization_members.entity';
import { Role } from './roles.entity';

@Entity('user_app_access')
@Unique(['user_id', 'organization_id', 'app_id'])
@Index(['user_id', 'organization_id'])
@Index(['app_id'])
@Index(['granted_by'])
export class UserAppAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int' })
  app_id: number;

  @ManyToOne(() => App, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: App;

  @Column({ type: 'uuid' })
  granted_by: string; // User who granted access

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'granted_by' })
  granter: User;

  @Column({ type: 'uuid', nullable: true })
  member_id: string | null; // Link to organization member for role checking

  @ManyToOne(() => OrganizationMember, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'member_id' })
  member: OrganizationMember | null;

  @Column({ type: 'int', nullable: true })
  role_id: number | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

