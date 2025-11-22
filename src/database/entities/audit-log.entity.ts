import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['organization_id'])
@Index(['user_id'])
@Index(['action'])
@Index(['entity_type', 'entity_id'])
@Index(['created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  organization_id: string | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_id: string | null;

  @Column({ type: 'json', nullable: true })
  old_values: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  new_values: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
