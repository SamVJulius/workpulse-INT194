import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { Alert, AlertType } from '@database/entities/alert.entity';
import { EventsService } from '../../websocket/events.service';

@Processor('overtime-checker')
export class OvertimeCheckerProcessor extends WorkerHost {
    private readonly logger = new Logger(OvertimeCheckerProcessor.name);
    private readonly overtimeThresholdHours: number;

    constructor(
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
        @InjectRepository(Alert)
        private alertRepository: Repository<Alert>,
        private configService: ConfigService,
        private eventsService: EventsService,
    ) {
        super();
        this.overtimeThresholdHours = Number(this.configService.get<number>('app.overtimeThresholdHours', 9));
    }

    async process(job: Job): Promise<any> {
        this.logger.log('Running overtime checker job');

        const overtimeThresholdSeconds = this.overtimeThresholdHours * 3600;

        // Find active sessions exceeding overtime threshold
        const sessions = await this.sessionRepository
            .createQueryBuilder('session')
            .where('session.status = :status', { status: SessionStatus.ACTIVE })
            .andWhere('session.total_active_seconds + session.total_idle_seconds > :threshold', {
                threshold: overtimeThresholdSeconds,
            })
            .leftJoinAndSelect('session.user', 'user')
            .getMany();

        let alertsCreated = 0;

        for (const session of sessions) {
            // Check if alert already exists for this session today (idempotent)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingAlert = await this.alertRepository
                .createQueryBuilder('alert')
                .where('alert.user_id = :userId', { userId: session.user_id })
                .andWhere('alert.type = :type', { type: AlertType.OVERTIME })
                .andWhere('alert.created_at >= :today', { today })
                .andWhere('alert.resolved_at IS NULL')
                .getOne();

            if (!existingAlert) {
                const totalHours = Math.round(
                    ((session.total_active_seconds + session.total_idle_seconds) / 3600) * 10,
                ) / 10;

                const message = `You have worked for ${totalHours} hours, exceeding the ${this.overtimeThresholdHours} hour threshold`;

                const alert = this.alertRepository.create({
                    user_id: session.user_id,
                    type: AlertType.OVERTIME,
                    message,
                });

                await this.alertRepository.save(alert);

                // Emit WebSocket event
                this.eventsService.emitOvertimeAlert(session.user_id, session.id, message);

                alertsCreated++;
                this.logger.debug(`Overtime alert created for user ${session.user_id}, session ${session.id}`);
            }
        }

        this.logger.log(`Overtime check completed: ${alertsCreated} alerts created`);
        return { overtimeSessions: sessions.length, alertsCreated };
    }
}
