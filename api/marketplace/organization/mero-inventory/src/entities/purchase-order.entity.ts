import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn
} from 'typeorm';
import { Organization } from '../../../../../src/database/entities/organizations.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
    DRAFT = 'draft',
    ORDERED = 'ordered',
    RECEIVED = 'received',
    CANCELLED = 'cancelled'
}

@Entity('purchase_orders')
export class PurchaseOrder {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'organization_id' })
    organizationId!: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization!: Organization;

    @Column()
    number!: string; // PO Number

    @Column({ name: 'supplier_id' })
    supplierId!: string;

    @ManyToOne(() => Supplier)
    @JoinColumn({ name: 'supplier_id' })
    supplier!: Supplier;

    @Column({
        type: 'enum',
        enum: PurchaseOrderStatus,
        default: PurchaseOrderStatus.DRAFT
    })
    status!: PurchaseOrderStatus;

    @Column({ name: 'expected_date', type: 'date', nullable: true })
    expectedDate?: Date;

    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ nullable: true, type: 'text' })
    notes?: string;

    @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
    items!: PurchaseOrderItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
