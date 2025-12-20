import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { RoleTemplate } from './role_templates.entity';
import { Permission } from './permissions.entity';

@Entity('role_template_permissions')
@Unique(['role_template_id', 'permission_id'])
@Index(['role_template_id'])
@Index(['permission_id'])
export class RoleTemplatePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  role_template_id: number;

  @ManyToOne(() => RoleTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_template_id' })
  role_template: RoleTemplate;

  @Column({ type: 'int' })
  permission_id: number;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
