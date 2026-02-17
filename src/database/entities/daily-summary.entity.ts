import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('daily_summaries')
@Index(['user_id', 'date'], { unique: true })
export class DailySummary {
    @ApiProperty({ example: 'uuid', description: 'Unique Summary ID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'uuid', description: 'Organization ID' })
    @Column({ type: 'uuid' })
    organization_id: string;

    @ApiProperty({ example: 'uuid', description: 'User ID' })
    @Column({ type: 'uuid' })
    user_id: string;

    @ApiProperty({ example: '2023-01-01', description: 'Date of summary' })
    @Column({ type: 'date' })
    date: Date;

    @ApiProperty({ example: 28800, description: 'Total work seconds (Active + Idle)' })
    @Column({ type: 'integer', default: 0 })
    total_work_seconds: number;

    @ApiProperty({ example: 25200, description: 'Active work seconds' })
    @Column({ type: 'integer', default: 0 })
    active_seconds: number;

    @ApiProperty({ example: 3600, description: 'Idle seconds' })
    @Column({ type: 'integer', default: 0 })
    idle_seconds: number;

    @ApiProperty({ example: 87.5, description: 'Productivity score (0-100)' })
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    productivity_score: number;

    @ApiProperty({
        example: [{ app: 'VS Code', total_seconds: 3600, active_seconds: 3000, idle_seconds: 600 }],
        description: 'Application usage statistics',
        isArray: true
    })
    @Column({ type: 'jsonb', default: [] })
    app_usage: Array<{
        app: string;
        total_seconds: number;
        active_seconds: number;
        idle_seconds: number;
    }>;

    @ManyToOne(() => Organization, organization => organization.daily_summaries)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => User, user => user.daily_summaries)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
