import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../../../../../src/database/entities/organizations.entity';
import { User } from '../../../../../src/database/entities/users.entity';
import { Warehouse } from './warehouse.entity';
import { StockAdjustmentItem } from './stock-adjustment-item.entity';

@Entity('stock_adjustments')
export class StockAdjustment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId: string;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'adjustment_number', length: 100 })
    adjustmentNumber: string;

    @Column({ name: 'warehouse_id', type: 'uuid' })
    warehouseId: string;

    @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({ name: 'adjustment_date', type: 'date' })
    adjustmentDate: Date;

    @Column({ length: 255 })
    reason: string;

    @Column({
        type: 'enum',
        enum: ['DRAFT', 'APPROVED', 'CANCELLED'],
        default: 'DRAFT'
    })
    status: string;

    @Column('text', { nullable: true })
    notes: string;

    @Column({ name: 'approved_by', type: 'uuid', nullable: true })
    approvedById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'approved_by' })
    approvedBy: User;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt: Date;

    @Column({ name: 'created_by', type: 'uuid' })
    createdById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => StockAdjustmentItem, item => item.adjustment, { cascade: true })
    items: StockAdjustmentItem[];
}
