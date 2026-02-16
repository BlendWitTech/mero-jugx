import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Board } from './boards.entity';
import { Ticket } from './tickets.entity';
import { Organization } from './organizations.entity';

@Entity('board_columns')
@Index(['board_id'])
export class BoardColumn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    board_id: string;

    @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column({ name: 'organization_id', type: 'uuid' })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'int' })
    position: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    color: string | null;

    @Column({ type: 'int', nullable: true, comment: 'Work In Progress limit' })
    wip_limit: number | null;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Ticket, (ticket) => ticket.column)
    tickets: Ticket[];
}
