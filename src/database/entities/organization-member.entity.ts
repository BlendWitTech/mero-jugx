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
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

export enum OrganizationMemberStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  LEFT = 'left',
}

@Entity('organization_members')
@Unique(['organization_id', 'user_id'])
@Index(['user_id'])
@Index(['role_id'])
@Index(['status'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  @Index()
  role_id: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'uuid', nullable: true })
  invited_by: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @Column({
    type: 'enum',
    enum: OrganizationMemberStatus,
    default: OrganizationMemberStatus.ACTIVE,
  })
  status: OrganizationMemberStatus;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  revoked_by: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'revoked_by' })
  revoker: User | null;

  @Column({ type: 'uuid', nullable: true })
  data_transferred_to: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'data_transferred_to' })
  data_recipient: User | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
