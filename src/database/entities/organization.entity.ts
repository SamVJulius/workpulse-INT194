import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { WorkSession } from './work-session.entity';
import { DailySummary } from './daily-summary.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    plan_type: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @OneToMany(() => User, user => user.organization)
    users: User[];

    @OneToMany(() => Project, project => project.organization)
    projects: Project[];

    @OneToMany(() => WorkSession, session => session.organization)
    work_sessions: WorkSession[];

    @OneToMany(() => DailySummary, summary => summary.organization)
    daily_summaries: DailySummary[];
}
