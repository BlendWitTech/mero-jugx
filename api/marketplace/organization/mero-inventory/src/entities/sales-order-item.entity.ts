import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from './product.entity';

@Entity('sales_order_items')
@Index(['sales_order_id'])
@Index(['product_id'])
export class SalesOrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    sales_order_id: string;

    @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sales_order_id' })
    sales_order: SalesOrder;

    @Column({ type: 'uuid' })
    product_id: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unit_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;
}
