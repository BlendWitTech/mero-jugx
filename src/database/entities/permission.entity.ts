import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Index(['slug'], { unique: true })
@Index(['category'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  role_permissions: RolePermission[];
}

