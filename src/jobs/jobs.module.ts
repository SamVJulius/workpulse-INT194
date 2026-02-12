import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DailySummaryProcessor } from './processors/daily-summary.processor';
import { IdleDetectionProcessor } from './processors/idle-detection.processor';
import { OvertimeCheckerProcessor } from './processors/overtime-checker.processor';
import { DailySummary } from '@database/entities/daily-summary.entity';
import { WorkSession } from '@database/entities/work-session.entity';
import { Alert } from '@database/entities/alert.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DailySummary, WorkSession, Alert]),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('redis.host'),
                    port: configService.get<number>('redis.port'),
                    password: configService.get<string>('redis.password'),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: {
                        age: 86400, // 24 hours
                        count: 100,
                    },
                    removeOnFail: {
                        age: 604800, // 7 days
                    },
                },
            }),
        }),
        BullModule.registerQueue(
            { name: 'daily-summary' },
            { name: 'idle-detection' },
            { name: 'overtime-checker' },
        ),
        WebsocketModule,
    ],
    providers: [DailySummaryProcessor, IdleDetectionProcessor, OvertimeCheckerProcessor],
    exports: [BullModule],
})
export class JobsModule { }
