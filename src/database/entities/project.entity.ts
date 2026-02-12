import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { WorkSession } from './work-session.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    organization_id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'uuid' })
    created_by: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @ManyToOne(() => Organization, organization => organization.projects)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ManyToOne(() => User, user => user.created_projects)
    @JoinColumn({ name: 'created_by' })
    created_by_user: User;

    @OneToMany(() => WorkSession, session => session.project)
    work_sessions: WorkSession[];
}
