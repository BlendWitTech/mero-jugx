import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../../../src/database/entities/users.entity';
import { Workspace } from './workspace.entity';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('mero_board_workspace_members')
@Unique(['workspace_id', 'user_id'])
@Index(['workspace_id'])
@Index(['user_id'])
@Index(['role'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role: WorkspaceRole;

  @Column({ type: 'uuid' })
  invited_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @CreateDateColumn()
  joined_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}


