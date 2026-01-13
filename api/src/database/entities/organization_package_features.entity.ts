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
import { Organization } from './organizations.entity';
import { PackageFeature } from './package_features.entity';

export enum OrganizationPackageFeatureStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

@Entity('organization_package_features')
@Unique(['organization_id', 'feature_id'])
@Index(['status'])
export class OrganizationPackageFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int' })
  @Index()
  feature_id: number;

  @ManyToOne(() => PackageFeature)
  @JoinColumn({ name: 'feature_id' })
  feature: PackageFeature;

  @Column({
    type: 'enum',
    enum: OrganizationPackageFeatureStatus,
    default: OrganizationPackageFeatureStatus.ACTIVE,
  })
  status: OrganizationPackageFeatureStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchased_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
