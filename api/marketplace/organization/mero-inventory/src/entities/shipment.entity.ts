import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { User } from '../../../../../src/database/entities/users.entity';

export enum ShipmentStatus {
    PENDING = 'PENDING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

@Entity('shipments')
@Index(['sales_order_id'])
@Index(['status'])
export class Shipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    shipment_number: string;

    @Column({ type: 'uuid' })
    sales_order_id: string;

    @ManyToOne(() => SalesOrder)
    @JoinColumn({ name: 'sales_order_id' })
    sales_order: SalesOrder;

    @Column({ type: 'varchar', length: 50, default: ShipmentStatus.PENDING })
    status: ShipmentStatus;

    @Column({ type: 'date', nullable: true })
    shipped_date: Date | null;

    @Column({ type: 'date', nullable: true })
    delivered_date: Date | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    carrier: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    tracking_number: string | null;

    @Column({ type: 'text', nullable: true })
    shipping_address: string | null;

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
