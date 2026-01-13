import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { CrmInvoice } from './crm_invoices.entity';

@Entity('crm_payments')
export class CrmPayment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    removed: boolean;

    @Column({ name: 'invoice_id' })
    invoiceId: string;

    @ManyToOne(() => CrmInvoice, (invoice) => invoice.payments)
    @JoinColumn({ name: 'invoice_id' })
    invoice: CrmInvoice;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'created_by_id' })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    paymentMode: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
