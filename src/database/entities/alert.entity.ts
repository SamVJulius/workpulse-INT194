import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AlertType {
    IDLE = 'idle',
    OVERTIME = 'overtime',
}

@Entity('alerts')
export class Alert {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'enum', enum: AlertType })
    type: AlertType;

    @Column({ type: 'text' })
    message: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    resolved_at: Date;

    @ManyToOne(() => User, user => user.alerts)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
