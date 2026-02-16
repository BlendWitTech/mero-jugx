import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Organization } from '../../../../../src/database/entities/organizations.entity';

@Entity('suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'organization_id' })
    organizationId!: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization!: Organization;

    @Column()
    name!: string;

    @Column({ nullable: true })
    email?: string; // Optional

    @Column({ nullable: true })
    phone?: string; // Optional

    @Column({ nullable: true, type: 'text' })
    address?: string; // Optional

    @Column({ name: 'contact_person', nullable: true })
    contactPerson?: string; // Optional

    @Column({ name: 'tax_id', nullable: true })
    taxId?: string; // Optional (PAN/VAT)

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
