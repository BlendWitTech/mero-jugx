import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Organization } from './organizations.entity';
import { User } from './users.entity';
import { BoardWorkspace } from './board_workspaces.entity';

@Entity('board_projects')
export class BoardProject {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true, type: 'text' })
    description!: string;

    @Column({ default: 'ACTIVE' })
    status!: string;

    @Column({ name: 'organization_id' })
    organizationId!: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization!: Organization;

    @Column({ name: 'workspace_id' })
    workspaceId!: string;

    @ManyToOne(() => BoardWorkspace)
    @JoinColumn({ name: 'workspace_id' })
    workspace!: BoardWorkspace;

    @Column({ name: 'created_by_id' })
    createdById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy!: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
