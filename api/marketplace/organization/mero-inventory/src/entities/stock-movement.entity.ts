import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../../../../src/database/entities/organizations.entity';
import { User } from '../../../../../src/database/entities/users.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    ADJUSTMENT = 'ADJUSTMENT'
}

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId: string;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'warehouse_id', type: 'uuid' })
    warehouseId: string;

    @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({
        type: 'enum',
        enum: StockMovementType
    })
    type: StockMovementType;

    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number;

    @Column({ name: 'reference_type', length: 50, nullable: true })
    referenceType: string;

    @Column({ name: 'reference_id', type: 'uuid', nullable: true })
    referenceId: string;

    @Column('decimal', { name: 'cost_price', precision: 10, scale: 2, nullable: true })
    costPrice: number;

    @Column('text', { nullable: true })
    notes: string;

    @Column({ name: 'created_by', type: 'uuid' })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
