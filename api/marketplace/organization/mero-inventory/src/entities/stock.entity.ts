
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

@Entity('stocks')
export class Stock {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id' })
    productId: string;

    @ManyToOne(() => Product, product => product.stocks)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'warehouse_id' })
    warehouseId: string;

    @ManyToOne(() => Warehouse, warehouse => warehouse.stocks)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
