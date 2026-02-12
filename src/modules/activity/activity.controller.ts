import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { ActivityUpdateDto, BulkActivityUploadDto } from '../sessions/dto/activity.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    @Post(':id/activity')
    async logActivity(
        @Param('id') sessionId: string,
        @CurrentUser() user: User,
        @Body() activityDto: ActivityUpdateDto,
    ) {
        return this.activityService.logActivity(sessionId, user, activityDto);
    }

    @Post(':id/activity/bulk')
    async bulkUploadActivities(
        @Param('id') sessionId: string,
        @CurrentUser() user: User,
        @Body() bulkDto: BulkActivityUploadDto,
    ) {
        return this.activityService.bulkUploadActivities(sessionId, user, bulkDto);
    }
}
