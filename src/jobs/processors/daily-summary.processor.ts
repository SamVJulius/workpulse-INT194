import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailySummary } from '@database/entities/daily-summary.entity';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';

@Processor('daily-summary')
export class DailySummaryProcessor extends WorkerHost {
    private readonly logger = new Logger(DailySummaryProcessor.name);

    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
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
            const totalWorkSeconds = userSessions.reduce((sum, s) => {
                if (s.end_time) {
                    return sum + (s.end_time.getTime() - s.start_time.getTime()) / 1000;
                }
                return sum;
            }, 0);

            const activeSeconds = userSessions.reduce((sum, s) => sum + s.total_active_seconds, 0);
            const idleSeconds = userSessions.reduce((sum, s) => sum + s.total_idle_seconds, 0);

            const productivityScore = totalWorkSeconds > 0 ? (activeSeconds / totalWorkSeconds) * 100 : 0;

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
                },
                ['user_id', 'date'],
            );

            this.logger.debug(`Daily summary created for user ${userId} on ${date}`);
        }

        this.logger.log(`Daily summary processing completed for ${date}`);
        return { processed: userSessionsMap.size, date };
    }
}
