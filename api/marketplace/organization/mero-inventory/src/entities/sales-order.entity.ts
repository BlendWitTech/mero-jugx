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
import { Organization } from '../../../../../src/database/entities/organizations.entity'; // Adjust path
import { User } from '../../../../../src/database/entities/users.entity'; // Adjust path
import { SalesOrderItem } from './sales-order-item.entity';

export enum SalesOrderStatus {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
}

@Entity('sales_orders')
@Index(['organization_id'])
@Index(['status'])
export class SalesOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    order_number: string;

    @Column({ type: 'uuid' })
    organization_id: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ type: 'uuid', nullable: true })
    customer_id: string | null;

    // TODO: Add Customer entity relationship if available, otherwise use plain fields for now
    @Column({ type: 'varchar', length: 255, nullable: true })
    customer_name: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    customer_email: string | null;

    @Column({ type: 'varchar', length: 50, default: SalesOrderStatus.DRAFT })
    status: SalesOrderStatus;

    @Column({ type: 'date', nullable: true })
    order_date: Date | null;

    @Column({ type: 'date', nullable: true })
    expected_shipment_date: Date | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @OneToMany(() => SalesOrderItem, (item) => item.sales_order, { cascade: true })
    items: SalesOrderItem[];

    @Column({ type: 'uuid' })
    created_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
