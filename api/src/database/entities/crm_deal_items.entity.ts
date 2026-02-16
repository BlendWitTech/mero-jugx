import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CrmDeal } from './crm_deals.entity';
import { Organization } from './organizations.entity';

@Entity('crm_deal_items')
export class CrmDealItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'deal_id', type: 'uuid' })
    dealId: string;

    @ManyToOne(() => CrmDeal, (deal) => deal.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'deal_id' })
    deal: CrmDeal;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'product_id', type: 'uuid', nullable: true })
    productId: string;

    // Optional: Link to Product entity if needed, but avoiding circular module deps for now.
    // Logic will handle fetching product details.

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    amount: number;
}
