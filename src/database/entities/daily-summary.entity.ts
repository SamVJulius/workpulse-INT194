import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('daily_summaries')
@Index(['user_id', 'date'], { unique: true })
export class DailySummary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    organization_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'integer', default: 0 })
    total_work_seconds: number;

    @Column({ type: 'integer', default: 0 })
    active_seconds: number;

    @Column({ type: 'integer', default: 0 })
    idle_seconds: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    productivity_score: number;

    @ManyToOne(() => Organization, organization => organization.daily_summaries)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => User, user => user.daily_summaries)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
