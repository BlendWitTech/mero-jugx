
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Organization } from '../../../../../src/database/entities/organizations.entity';
import { Stock } from './stock.entity';

@Entity('warehouses')
export class Warehouse {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organization_id: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column()
    name: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    contact_number: string;

    @Column({ default: 'main' }) // main, retail, storage, etc.
    type: string;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany(() => Stock, stock => stock.warehouse)
    stocks: Stock[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
