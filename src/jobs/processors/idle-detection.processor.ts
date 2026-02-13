import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { ActivityLog, ActivityType } from '@database/entities/activity-log.entity';
import { Alert, AlertType } from '@database/entities/alert.entity';
import { EventsService } from '../../websocket/events.service';

@Processor('idle-detection')
export class IdleDetectionProcessor extends WorkerHost {
    private readonly logger = new Logger(IdleDetectionProcessor.name);
    private readonly idleThresholdSeconds: number;
    private readonly inactiveThresholdSeconds: number;

    constructor(
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
        @InjectRepository(Alert)
        private alertRepository: Repository<Alert>,
        private configService: ConfigService,
        private eventsService: EventsService,
    ) {
        super();
        // Threshold for consecutive idle time before alerting (5 minutes)
        this.idleThresholdSeconds = this.configService.get<number>('app.idleThresholdSeconds', 300);
        // Threshold for no data received at all (10 minutes as fallback)
        this.inactiveThresholdSeconds = this.configService.get<number>('app.inactiveThresholdSeconds', 600);
    }

    async process(job: Job): Promise<any> {
        this.logger.log('Running idle detection job');

        const now = new Date();
        const idleThreshold = new Date(now.getTime() - this.idleThresholdSeconds * 1000);
        const inactiveThreshold = new Date(now.getTime() - this.inactiveThresholdSeconds * 1000);

        // Find all active sessions
        const activeSessions = await this.sessionRepository.find({
            where: {
                status: SessionStatus.ACTIVE,
            },
            relations: ['user'],
        });

        let alertsCreated = 0;

        for (const session of activeSessions) {
            // Check if alert already exists for this session (idempotent)
            const existingAlert = await this.alertRepository.findOne({
                where: {
                    user_id: session.user_id,
                    type: AlertType.IDLE,
                    resolved_at: (null as any),
                },
            });

            if (existingAlert) {
                // Alert already exists, skip
                continue;
            }

            // Check for recent activity logs (within the idle threshold window)
            const recentActivities = await this.activityLogRepository.find({
                where: {
                    session_id: session.id,
                    timestamp: MoreThan(idleThreshold),
                },
                order: {
                    timestamp: 'DESC',
                },
            });

            let shouldAlert = false;
            let alertMessage = '';

            if (recentActivities.length === 0) {
                // No activity logs in the recent window - check if completely inactive
                if (session.last_activity_at && session.last_activity_at < inactiveThreshold) {
                    shouldAlert = true;
                    const inactiveMinutes = Math.floor(this.inactiveThresholdSeconds / 60);
                    alertMessage = `No activity detected for more than ${inactiveMinutes} minutes`;
                }
            } else {
                // Check if all recent activities are IDLE type
                const allIdle = recentActivities.every(activity => activity.activity_type === ActivityType.IDLE);

                if (allIdle) {
                    // Calculate total consecutive idle time
                    const totalIdleSeconds = recentActivities.reduce(
                        (sum, activity) => sum + activity.duration_seconds,
                        0
                    );

                    if (totalIdleSeconds >= this.idleThresholdSeconds) {
                        shouldAlert = true;
                        const idleMinutes = Math.floor(totalIdleSeconds / 60);
                        alertMessage = `You have been idle for ${idleMinutes} minutes (no mouse/keyboard activity)`;
                    }
                }
            }

            if (shouldAlert) {
                const alert = this.alertRepository.create({
                    user_id: session.user_id,
                    type: AlertType.IDLE,
                    message: alertMessage,
                });

                await this.alertRepository.save(alert);

                // Emit WebSocket event
                this.eventsService.emitInactiveAlert(session.user_id, session.id, alertMessage);

                alertsCreated++;
                this.logger.debug(`Idle alert created for user ${session.user_id}, session ${session.id}: ${alertMessage}`);
            }
        }

        this.logger.log(`Idle detection completed: ${activeSessions.length} sessions checked, ${alertsCreated} alerts created`);
        return { sessionsChecked: activeSessions.length, alertsCreated };
    }
}
