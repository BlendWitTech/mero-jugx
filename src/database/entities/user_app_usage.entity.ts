import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './users.entity';
import { Organization } from './organizations.entity';
import { App } from './apps.entity';

@Entity('user_app_usage')
@Index(['user_id', 'organization_id'])
@Index(['created_at'])
export class UserAppUsage {
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

  @CreateDateColumn()
  created_at: Date;
}

