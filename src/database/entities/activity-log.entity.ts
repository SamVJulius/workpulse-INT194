import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WorkSession } from './work-session.entity';

export enum ActivityType {
    ACTIVE = 'active',
    IDLE = 'idle',
}

@Entity('activity_logs')
@Index(['session_id', 'timestamp'])
@Index(['session_id', 'client_activity_id'], { unique: true, where: 'client_activity_id IS NOT NULL' })
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    session_id: string;

    @Column({ type: 'timestamp' })
    timestamp: Date;

    @Column({ type: 'enum', enum: ActivityType })
    activity_type: ActivityType;

    @Column({ type: 'integer' })
    duration_seconds: number;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    url: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    client_activity_id: string;

    @ManyToOne(() => WorkSession, session => session.activity_logs)
    @JoinColumn({ name: 'session_id' })
    session: WorkSession;
}
