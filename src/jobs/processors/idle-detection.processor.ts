import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { Alert, AlertType } from '@database/entities/alert.entity';
import { EventsService } from '../../websocket/events.service';

@Processor('idle-detection')
export class IdleDetectionProcessor extends WorkerHost {
    private readonly logger = new Logger(IdleDetectionProcessor.name);
    private readonly idleThresholdSeconds: number;

    constructor(
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
        @InjectRepository(Alert)
        private alertRepository: Repository<Alert>,
        private configService: ConfigService,
        private eventsService: EventsService,
    ) {
        super();
        this.idleThresholdSeconds = this.configService.get<number>('app.idleThresholdSeconds', 300);
    }

    async process(job: Job): Promise<any> {
        this.logger.log('Running idle detection job');

        const idleThreshold = new Date();
        idleThreshold.setSeconds(idleThreshold.getSeconds() - this.idleThresholdSeconds);

        // Find active sessions with last activity older than threshold
        const idleSessions = await this.sessionRepository.find({
            where: {
                status: SessionStatus.ACTIVE,
                last_activity_at: LessThan(idleThreshold),
            },
            relations: ['user'],
        });

        let alertsCreated = 0;

        for (const session of idleSessions) {
            // Check if alert already exists for this session (idempotent)
            const existingAlert = await this.alertRepository.findOne({
                where: {
                    user_id: session.user_id,
                    type: AlertType.IDLE,
                    resolved_at: (null as any), // TypeORM handles null literals in where, but strict TS might complain if it expects FindOperator
                },
            });

            if (!existingAlert) {
                const idleMinutes = Math.floor(this.idleThresholdSeconds / 60);
                const message = `You have been idle for more than ${idleMinutes} minutes`;

                const alert = this.alertRepository.create({
                    user_id: session.user_id,
                    type: AlertType.IDLE,
                    message,
                });

                await this.alertRepository.save(alert);

                // Emit WebSocket event
                this.eventsService.emitInactiveAlert(session.user_id, session.id, message);

                alertsCreated++;
                this.logger.debug(`Idle alert created for user ${session.user_id}, session ${session.id}`);
            }
        }

        this.logger.log(`Idle detection completed: ${alertsCreated} alerts created`);
        return { idleSessions: idleSessions.length, alertsCreated };
    }
}
