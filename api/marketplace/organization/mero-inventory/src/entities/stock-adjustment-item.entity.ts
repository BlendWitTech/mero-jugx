import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StockAdjustment } from './stock-adjustment.entity';
import { Product } from './product.entity';

@Entity('stock_adjustment_items')
export class StockAdjustmentItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'adjustment_id', type: 'uuid' })
    adjustmentId: string;

    @ManyToOne(() => StockAdjustment, adjustment => adjustment.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'adjustment_id' })
    adjustment: StockAdjustment;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('decimal', { name: 'system_quantity', precision: 10, scale: 2 })
    systemQuantity: number;

    @Column('decimal', { name: 'actual_quantity', precision: 10, scale: 2 })
    actualQuantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    difference: number;

    @Column('text', { nullable: true })
    notes: string;
}
