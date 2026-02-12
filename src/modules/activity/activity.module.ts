import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityLog } from '@database/entities/activity-log.entity';
import { WorkSession } from '@database/entities/work-session.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ActivityLog, WorkSession]),
        SessionsModule,
    ],
    controllers: [ActivityController],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule { }
