import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DailySummary } from '@database/entities/daily-summary.entity';
import { WorkSession } from '@database/entities/work-session.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DailySummary, WorkSession])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
