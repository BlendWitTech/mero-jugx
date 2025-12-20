import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationPackageFeature } from './organization_package_features.entity';

export enum PackageFeatureType {
  USER_UPGRADE = 'user_upgrade',
  ROLE_UPGRADE = 'role_upgrade',
  CHAT = 'chat', // Chat system feature (deprecated, use SUPPORT)
  SUPPORT = 'support', // Support features like chat system
}

@Entity('package_features')
@Index(['slug'], { unique: true })
@Index(['type'])
export class PackageFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: PackageFeatureType,
  })
  type: PackageFeatureType;

  @Column({ type: 'int', nullable: true })
  value: number | null; // NULL = unlimited

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => OrganizationPackageFeature, (orgFeature) => orgFeature.feature)
  organization_features: OrganizationPackageFeature[];
}
