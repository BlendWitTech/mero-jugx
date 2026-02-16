import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from './product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'purchase_order_id' })
    purchaseOrderId!: string;

    @ManyToOne(() => PurchaseOrder, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchase_order_id' })
    purchaseOrder!: PurchaseOrder;

    @Column({ name: 'product_id' })
    productId!: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity!: number;

    @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
    unitPrice!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total!: number;
}
