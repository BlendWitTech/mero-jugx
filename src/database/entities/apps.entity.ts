import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationApp } from './organization_apps.entity';

export enum AppStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum AppBillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum AppTargetAudience {
  ORGANIZATION = 'organization',
  CREATOR = 'creator',
  BOTH = 'both',
}

@Entity('apps')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['category'])
@Index(['is_featured'])
@Index(['target_audience'])
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  // Basic Information
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  short_description: string | null;

  // Media
  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner_url: string | null;

  @Column({ type: 'json', nullable: true })
  screenshots: string[] | null; // Array of image URLs

  // Categorization
  @Column({ type: 'varchar', length: 100 })
  category: string; // e.g., 'productivity', 'communication', 'analytics'

  @Column({ type: 'json', nullable: true })
  tags: string[] | null; // Array of tags

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: AppBillingPeriod,
    default: AppBillingPeriod.MONTHLY,
  })
  billing_period: AppBillingPeriod;

  @Column({ type: 'int', default: 0 })
  trial_days: number; // 0 = no trial

  // Features & Capabilities
  @Column({ type: 'json', nullable: true })
  features: string[] | null; // Array of feature descriptions

  @Column({ type: 'json', nullable: true })
  permissions: string[] | null; // Array of permission keys this app requires

  // Metadata
  @Column({ type: 'varchar', length: 255 })
  developer_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  developer_email: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  developer_website: string | null;

  @Column({ type: 'varchar', length: 50, default: '1.0.0' })
  version: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  support_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentation_url: string | null;

  // Status & Visibility
  @Column({
    type: 'enum',
    enum: AppStatus,
    default: AppStatus.DRAFT,
  })
  status: AppStatus;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // Target Audience
  @Column({
    type: 'enum',
    enum: AppTargetAudience,
    default: AppTargetAudience.ORGANIZATION,
  })
  target_audience: AppTargetAudience;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  // Statistics (read-only, calculated)
  @Column({ type: 'int', default: 0 })
  subscription_count: number; // Number of active subscriptions

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rating: number | null; // Average rating (0-5)

  @Column({ type: 'int', default: 0 })
  review_count: number;

  // Timestamps
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => OrganizationApp, (orgApp) => orgApp.app)
  organization_apps: OrganizationApp[];
}

