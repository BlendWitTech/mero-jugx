import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from './users.entity';
import { Organization } from './organizations.entity';
import { App } from './apps.entity';

@Entity('user_app_pinned')
@Unique(['user_id', 'organization_id', 'app_id'])
@Index(['user_id', 'organization_id'])
export class UserAppPinned {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int' })
  app_id: number;

  @ManyToOne(() => App)
  @JoinColumn({ name: 'app_id' })
  app: App;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

