import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ActivityLog, ActivityType } from '@database/entities/activity-log.entity';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { User } from '@database/entities/user.entity';
import { ActivityUpdateDto, BulkActivityUploadDto } from '../sessions/dto/activity.dto';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class ActivityService {
    private readonly logger = new Logger(ActivityService.name);
    private readonly inactiveThresholdSeconds: number;
    private readonly idleThresholdSeconds: number;

    constructor(
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
        private sessionsService: SessionsService,
        private configService: ConfigService,
        private dataSource: DataSource,
    ) {
        this.inactiveThresholdSeconds = this.configService.get<number>('app.inactiveThresholdSeconds', 60);
        this.idleThresholdSeconds = this.configService.get<number>('app.idleThresholdSeconds', 300);
    }

    async logActivity(
        sessionId: string,
        user: User,
        activityDto: ActivityUpdateDto,
    ): Promise<{ session: WorkSession; activity: ActivityLog }> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.user_id !== user.id) {
            throw new ForbiddenException('You can only log activity for your own sessions');
        }

        if (session.status === SessionStatus.STOPPED) {
            throw new BadRequestException('Cannot log activity for stopped session');
        }

        const timestamp = activityDto.timestamp ? new Date(activityDto.timestamp) : new Date();

        // Validate timestamp is within session bounds
        if (timestamp < session.start_time) {
            throw new BadRequestException('Activity timestamp cannot be before session start time');
        }

        if (session.end_time && timestamp > session.end_time) {
            throw new BadRequestException('Activity timestamp cannot be after session end time');
        }

        if (timestamp > new Date()) {
            throw new BadRequestException('Activity timestamp cannot be in the future');
        }

        // Create activity log
        const activityLog = this.activityLogRepository.create({
            session_id: sessionId,
            timestamp,
            activity_type: activityDto.activity_type,
            duration_seconds: activityDto.duration_seconds,
            url: activityDto.url,
        });

        const savedActivity = await this.activityLogRepository.save(activityLog);

        // Update session totals with optimistic locking
        const activeSeconds = activityDto.activity_type === ActivityType.ACTIVE ? activityDto.duration_seconds : 0;
        const idleSeconds = activityDto.activity_type === ActivityType.IDLE ? activityDto.duration_seconds : 0;

        const updatedSession = await this.sessionsService.updateSessionTotals(
            sessionId,
            activeSeconds,
            idleSeconds,
        );

        this.logger.debug(`Activity logged for session ${sessionId}: ${activityDto.activity_type} (${activityDto.duration_seconds}s)`);

        if (!updatedSession) {
            throw new BadRequestException('Failed to update session totals');
        }

        return {
            session: updatedSession,
            activity: savedActivity,
        };
    }

    async bulkUploadActivities(
        sessionId: string,
        user: User,
        bulkDto: BulkActivityUploadDto,
    ): Promise<{ session: WorkSession; uploaded: number; duplicates: number }> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.user_id !== user.id) {
            throw new ForbiddenException('You can only upload activities for your own sessions');
        }

        if (session.status === SessionStatus.STOPPED) {
            throw new BadRequestException('Cannot upload activities for stopped session');
        }

        // Sort activities by timestamp
        const sortedActivities = bulkDto.activities.sort(
            (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        // Validate all timestamps
        for (const activity of sortedActivities) {
            const timestamp = new Date(activity.timestamp);

            if (timestamp < session.start_time) {
                throw new BadRequestException(
                    `Activity timestamp ${activity.timestamp} cannot be before session start time`,
                );
            }

            if (session.end_time && timestamp > session.end_time) {
                throw new BadRequestException(
                    `Activity timestamp ${activity.timestamp} cannot be after session end time`,
                );
            }

            if (timestamp > new Date()) {
                throw new BadRequestException(`Activity timestamp ${activity.timestamp} cannot be in the future`);
            }
        }

        let uploadedCount = 0;
        let duplicateCount = 0;
        let totalActiveSeconds = 0;
        let totalIdleSeconds = 0;

        // Use transaction for atomicity
        await this.dataSource.transaction(async (manager) => {
            for (const activity of sortedActivities) {
                try {
                    const activityLog = manager.create(ActivityLog, {
                        session_id: sessionId,
                        client_activity_id: activity.client_activity_id,
                        timestamp: new Date(activity.timestamp),
                        activity_type: activity.activity_type,
                        duration_seconds: activity.duration_seconds,
                        url: activity.url,
                    });

                    await manager.save(ActivityLog, activityLog);

                    uploadedCount++;

                    if (activity.activity_type === ActivityType.ACTIVE) {
                        totalActiveSeconds += activity.duration_seconds;
                    } else {
                        totalIdleSeconds += activity.duration_seconds;
                    }
                } catch (error) {
                    // Duplicate client_activity_id - silently skip (idempotent)
                    if (error.code === '23505') {
                        // PostgreSQL unique violation
                        duplicateCount++;
                        this.logger.debug(`Duplicate activity skipped: ${activity.client_activity_id}`);
                    } else {
                        throw error;
                    }
                }
            }

            // Update session totals if any new activities were uploaded
            if (uploadedCount > 0) {
                const sessionToUpdate = await manager.findOne(WorkSession, {
                    where: { id: sessionId },
                });

                if (sessionToUpdate) {
                    sessionToUpdate.total_active_seconds += totalActiveSeconds;
                    sessionToUpdate.total_idle_seconds += totalIdleSeconds;
                    sessionToUpdate.last_activity_at = new Date();

                    await manager.save(WorkSession, sessionToUpdate);
                }
            }
        });

        const updatedSession = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });

        this.logger.log(
            `Bulk upload completed for session ${sessionId}: ${uploadedCount} uploaded, ${duplicateCount} duplicates`,
        );

        if (!updatedSession) {
            throw new BadRequestException('Failed to retrieve updated session');
        }

        return {
            session: updatedSession,
            uploaded: uploadedCount,
            duplicates: duplicateCount,
        };
    }
}
