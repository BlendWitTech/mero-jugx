import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';

export enum DocumentType {
  CONTRACT = 'contract',
  LICENSE = 'license',
  CERTIFICATE = 'certificate',
  INVOICE = 'invoice',
  OFFICE_REGISTRATION = 'office_registration',
  LETTERHEAD = 'letterhead',
  INVOICE_TEMPLATE = 'invoice_template',
  OTHER = 'other',
}

@Entity('organization_documents')
@Index(['organization_id'])
@Index(['document_type'])
@Index(['is_active'])
export class OrganizationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string | null; // Public URL for viewing

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string | null; // Thumbnail for preview

  @Column({ type: 'varchar', length: 100, nullable: true })
  file_type: string | null;

  @Column({ type: 'bigint', default: 0 })
  file_size: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  document_type: DocumentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  is_scanned: boolean; // Whether document was scanned

  @Column({ type: 'jsonb', nullable: true })
  scan_metadata: Record<string, any> | null; // OCR/metadata from scanning

  @Column({ type: 'boolean', default: false })
  has_signature: boolean; // Whether document has signature

  @Column({ type: 'varchar', length: 500, nullable: true })
  signature_url: string | null; // URL to signature image

  @Column({ type: 'boolean', default: false })
  has_logo: boolean; // Whether document has logo

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null; // URL to logo image

  @Column({ type: 'varchar', length: 100, nullable: true })
  letterhead_design_id: string | null; // Design template ID for letterhead

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_design_id: string | null; // Design template ID for invoice

  @Column({ type: 'jsonb', nullable: true })
  design_metadata: Record<string, any> | null; // Design configuration/metadata

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null; // User who created the document

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'boolean', default: false })
  is_template: boolean; // Whether this is a template document

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
