import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { CrmInvoice } from './crm_invoices.entity';

@Entity('crm_clients')
export class CrmClient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    removed: boolean;

    @Column({ type: 'boolean', default: true })
    enabled: boolean;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true, type: 'text' })
    address: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'created_by_id', nullable: true })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ name: 'assigned_to_id', nullable: true })
    assignedToId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to_id' })
    assignedTo: User;

    @OneToMany(() => CrmInvoice, (invoice) => invoice.client)
    invoices: CrmInvoice[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
