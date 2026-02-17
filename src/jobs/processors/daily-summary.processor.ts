import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { DailySummary } from '@database/entities/daily-summary.entity';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { ActivityLog, ActivityType } from '@database/entities/activity-log.entity';

@Processor('daily-summary')
export class DailySummaryProcessor extends WorkerHost {
    private readonly logger = new Logger(DailySummaryProcessor.name);

    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        const { date } = job.data;
        this.logger.log(`Processing daily summary for date: ${date}`);

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all sessions for the day
        const sessions = await this.sessionRepository.find({
            where: {
                start_time: Between(startOfDay, endOfDay),
            },
            relations: ['user'],
        });

        // Filter out sessions without users and group by user
        const userSessionsMap = new Map<string, WorkSession[]>();

        for (const session of sessions) {
            if (!session.user_id) continue;

            if (!userSessionsMap.has(session.user_id)) {
                userSessionsMap.set(session.user_id, []);
            }
            userSessionsMap.get(session.user_id)!.push(session);
        }

        // Create or update daily summaries
        for (const [userId, userSessions] of userSessionsMap) {
            const activeSeconds = userSessions.reduce((sum, s) => sum + s.total_active_seconds, 0);
            const idleSeconds = userSessions.reduce((sum, s) => sum + s.total_idle_seconds, 0);

            // Total work time is the sum of active and idle time (actual tracked time)
            const totalWorkSeconds = activeSeconds + idleSeconds;

            const productivityScore = totalWorkSeconds > 0 ? (activeSeconds / totalWorkSeconds) * 100 : 0;

            // Aggregate application usage from activity logs
            const sessionIds = userSessions.map(s => s.id);
            const activityLogs = await this.activityLogRepository.find({
                where: {
                    session_id: In(sessionIds)
                }
            });

            // Group by application (url field) and sum durations
            const appUsageMap = new Map<string, {
                total_seconds: number;
                active_seconds: number;
                idle_seconds: number;
            }>();

            for (const log of activityLogs) {
                if (!log.url) continue; // Skip if no URL/app name

                const app = log.url;
                if (!appUsageMap.has(app)) {
                    appUsageMap.set(app, {
                        total_seconds: 0,
                        active_seconds: 0,
                        idle_seconds: 0
                    });
                }

                const usage = appUsageMap.get(app)!;
                usage.total_seconds += log.duration_seconds;

                if (log.activity_type === ActivityType.ACTIVE) {
                    usage.active_seconds += log.duration_seconds;
                } else {
                    usage.idle_seconds += log.duration_seconds;
                }
            }

            // Convert to array and sort by total_seconds (descending)
            const appUsage = Array.from(appUsageMap.entries())
                .map(([app, usage]) => ({ app, ...usage }))
                .sort((a, b) => b.total_seconds - a.total_seconds);

            const organizationId = userSessions[0].organization_id;

            // Upsert (idempotent)
            await this.dailySummaryRepository.upsert(
                {
                    organization_id: organizationId,
                    user_id: userId,
                    date: targetDate,
                    total_work_seconds: Math.round(totalWorkSeconds),
                    active_seconds: activeSeconds,
                    idle_seconds: idleSeconds,
                    productivity_score: Math.round(productivityScore * 100) / 100,
                    app_usage: appUsage,
                },
                ['user_id', 'date'],
            );

            this.logger.debug(`Daily summary created for user ${userId} on ${date}`);
        }

        this.logger.log(`Daily summary processing completed for ${date}`);
        return { processed: userSessionsMap.size, date };
    }
}
