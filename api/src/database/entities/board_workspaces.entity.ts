import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';

@Entity('board_workspaces')
export class BoardWorkspace {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true, type: 'text' })
    description!: string;

    @Column({ nullable: true })
    color!: string;

    @Column({ name: 'organization_id' })
    organizationId!: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization!: Organization;

    @Column({ name: 'owner_id' })
    ownerId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'owner_id' })
    owner!: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
