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
import { Organization } from './organizations.entity';

@Entity('crm_settings')
@Index(['organizationId'])
@Index(['organizationId', 'settingKey'], { unique: true })
export class CrmSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'setting_key' })
    settingKey: string;

    @Column({ name: 'setting_value', type: 'text', nullable: true })
    settingValue: string;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
