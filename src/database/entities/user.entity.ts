import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { WorkSession } from './work-session.entity';
import { DailySummary } from './daily-summary.entity';
import { Alert } from './alert.entity';
import { Project } from './project.entity';

export enum UserRole {
    ADMIN = 'admin',
    EMPLOYEE = 'employee',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['organization_id', 'email'], { unique: true })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    organization_id: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
    role: UserRole;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @Column({ type: 'timestamp', nullable: true })
    last_seen: Date;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @ManyToOne(() => Organization, organization => organization.users)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @OneToMany(() => WorkSession, session => session.user)
    work_sessions: WorkSession[];

    @OneToMany(() => DailySummary, summary => summary.user)
    daily_summaries: DailySummary[];

    @OneToMany(() => Alert, alert => alert.user)
    alerts: Alert[];

    @OneToMany(() => Project, project => project.created_by_user)
    created_projects: Project[];
}
