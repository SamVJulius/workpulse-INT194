import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@database/entities/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
    constructor(
        @InjectQueue('daily-summary') private dailySummaryQueue: Queue,
        @InjectQueue('idle-detection') private idleDetectionQueue: Queue,
    ) { }

    @Post('trigger/daily-summary')
    @Roles(UserRole.ADMIN)
    async triggerDailySummary(@Body('date') date: string) {
        const job = await this.dailySummaryQueue.add('generate', {
            date: date || new Date().toISOString().split('T')[0]
        });
        return {
            success: true,
            message: `Daily summary job triggered for ${job.data.date}`,
            jobId: job.id
        };
    }

    @Post('trigger/idle-detection')
    @Roles(UserRole.ADMIN)
    async triggerIdleDetection() {
        const job = await this.idleDetectionQueue.add('check', {});
        return {
            success: true,
            message: 'Idle detection job triggered',
            jobId: job.id
        };
    }
}
