import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationMember } from './organization-member.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
@Unique(['organization_id', 'slug'])
@Index(['organization_id'])
@Index(['is_system_role'])
@Index(['is_active'])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  organization_id: string | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  is_system_role: boolean;

  @Column({ type: 'boolean', default: false })
  is_organization_owner: boolean;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  hierarchy_level: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Relations
  @OneToMany(() => OrganizationMember, (member) => member.role)
  members: OrganizationMember[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  role_permissions: RolePermission[];
}
