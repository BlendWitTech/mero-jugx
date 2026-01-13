import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { CrmClient } from './crm_clients.entity';

export enum QuoteStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    SENT = 'sent',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    CANCELLED = 'cancelled',
    ON_HOLD = 'on hold',
}

@Entity('crm_quotes')
@Index(['organizationId'])
@Index(['clientId'])
export class CrmQuote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    removed: boolean;

    @Column({ type: 'boolean', default: false })
    converted: boolean;

    @Column()
    number: number;

    @Column()
    year: number;

    @Column({ nullable: true, type: 'text' })
    content: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'expired_date', type: 'date' })
    expiredDate: Date;

    @Column({ name: 'client_id' })
    clientId: string;

    @ManyToOne(() => CrmClient)
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

    @OneToMany(() => CrmQuoteItem, (item) => item.quote, { cascade: true })
    items: CrmQuoteItem[];

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxRate: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    subTotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxTotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    discount: number;

    @Column({
        type: 'enum',
        enum: QuoteStatus,
        default: QuoteStatus.DRAFT,
    })
    status: QuoteStatus;

    @Column({ type: 'boolean', default: false })
    approved: boolean;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @Column({ nullable: true })
    pdf: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

@Entity('crm_quote_items')
export class CrmQuoteItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'quote_id' })
    quoteId: string;

    @ManyToOne(() => CrmQuote, (quote) => quote.items)
    @JoinColumn({ name: 'quote_id' })
    quote: CrmQuote;

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
