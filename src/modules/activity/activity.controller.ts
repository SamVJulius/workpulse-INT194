import { Controller, Post, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, getSchemaPath } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { ActivityUpdateDto, BulkActivityUploadDto, BulkActivityItemDto } from '../sessions/dto/activity.dto';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    private readonly logger = new Logger(ActivityController.name);

    constructor(private readonly activityService: ActivityService) { }

    @Post(':id/activity')
    @ApiOperation({ summary: 'Log a single activity' })
    @ApiResponse({ status: 201, description: 'Activity logged.' })
    async logActivity(
        @Param('id') sessionId: string,
        @CurrentUser() user: User,
        @Body() activityDto: ActivityUpdateDto,
    ) {
        return this.activityService.logActivity(sessionId, user, activityDto);
    }

    @Post(':id/activity/bulk')
    @ApiOperation({ summary: 'Bulk upload activities' })
    @ApiResponse({ status: 201, description: 'Activities uploaded.' })
    @ApiBody({
        description: 'Activities data',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(BulkActivityUploadDto) },
                {
                    type: 'array',
                    items: { $ref: getSchemaPath(BulkActivityItemDto) },
                },
            ],
        },
    })
    async bulkUploadActivities(
        @Param('id') sessionId: string,
        @CurrentUser() user: User,
        @Body() body: BulkActivityUploadDto | BulkActivityItemDto[],
    ) {
        // Log incoming data from Electron for debugging (using both console and logger)
        const logData = {
            sessionId,
            userId: user.id,
            isArray: Array.isArray(body),
            activityCount: Array.isArray(body) ? body.length : body.activities?.length || 0,
            rawBody: body
        };

        console.log('\n========== ELECTRON ACTIVITY DATA ==========');
        console.log(JSON.stringify(logData, null, 2));
        console.log('============================================\n');

        this.logger.log('=== ACTIVITY DATA FROM ELECTRON ===');
        this.logger.log(`Session ID: ${sessionId}`);
        this.logger.log(`User ID: ${user.id}`);
        this.logger.log(`Is Array: ${Array.isArray(body)}`);
        this.logger.log(`Raw Body: ${JSON.stringify(body, null, 2)}`);

        // Normalize input: handle both Electron format (direct array) and existing format (wrapped object)
        const bulkDto: BulkActivityUploadDto = Array.isArray(body)
            ? { activities: body }
            : body;

        this.logger.log(`Normalized Data: ${JSON.stringify(bulkDto, null, 2)}`);
        this.logger.log(`Number of activities: ${bulkDto.activities.length}`);
        this.logger.log('===================================');

        return this.activityService.bulkUploadActivities(sessionId, user, bulkDto);
    }
}
