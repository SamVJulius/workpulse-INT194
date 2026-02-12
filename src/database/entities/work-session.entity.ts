import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, VersionColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { ActivityLog } from './activity-log.entity';

export enum SessionStatus {
    ACTIVE = 'active',
    STOPPED = 'stopped',
}

@Entity('work_sessions')
@Index(['user_id', 'status'])
@Index(['last_activity_at'])
export class WorkSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    organization_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'uuid', nullable: true })
    project_id: string;

    @Column({ type: 'timestamp' })
    start_time: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_time: Date;

    @Column({ type: 'integer', default: 0 })
    total_active_seconds: number;

    @Column({ type: 'integer', default: 0 })
    total_idle_seconds: number;

    @Column({ type: 'timestamp', nullable: true })
    last_activity_at: Date;

    @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
    status: SessionStatus;

    @VersionColumn()
    version: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @ManyToOne(() => Organization, organization => organization.work_sessions)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => User, user => user.work_sessions)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Project, project => project.work_sessions, { nullable: true })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @OneToMany(() => ActivityLog, log => log.session)
    activity_logs: ActivityLog[];
}
