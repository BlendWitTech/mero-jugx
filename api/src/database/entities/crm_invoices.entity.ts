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
import { CrmClient } from './crm_clients.entity';
import { CrmPayment } from './crm_payments.entity';

export enum InvoiceStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    SENT = 'sent',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled',
    ON_HOLD = 'on hold',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    PARTIALLY = 'partially',
}

@Entity('crm_invoices')
export class CrmInvoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    removed: boolean;

    @Column()
    number: number;

    @Column()
    year: number;

    @Column({ nullable: true, type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter'],
        nullable: true,
    })
    recurring: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'expired_date', type: 'date' })
    expiredDate: Date;

    @Column({ name: 'client_id' })
    clientId: string;

    @ManyToOne(() => CrmClient, (client) => client.invoices)
    @JoinColumn({ name: 'client_id' })
    client: CrmClient;

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

    @OneToMany(() => CrmInvoiceItem, (item) => item.invoice, { cascade: true })
    items: CrmInvoiceItem[];

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxRate: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    subTotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxTotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    credit: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    discount: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.UNPAID,
    })
    paymentStatus: PaymentStatus;

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.DRAFT,
    })
    status: InvoiceStatus;

    @Column({ type: 'boolean', default: false })
    isOverdue: boolean;

    @Column({ type: 'boolean', default: false })
    approved: boolean;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @OneToMany(() => CrmPayment, (payment) => payment.invoice)
    payments: CrmPayment[];

    @Column({ nullable: true })
    pdf: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('crm_invoice_items')
export class CrmInvoiceItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id' })
    invoiceId: string;

    @ManyToOne(() => CrmInvoice, (invoice) => invoice.items)
    @JoinColumn({ name: 'invoice_id' })
    invoice: CrmInvoice;

    @Column()
    itemName: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total: number;
}
