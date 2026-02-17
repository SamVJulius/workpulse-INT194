import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@database/entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('daily')
    @ApiOperation({ summary: 'Get daily summary for current user' })
    @ApiResponse({ status: 200, description: 'Daily summary.' })
    @ApiQuery({ name: 'date', required: true, example: '2023-01-01', description: 'Date for the report (YYYY-MM-DD)' })
    async getDailySummary(
        @CurrentUser() user: User,
        @Query('date') date: string,
    ) {
        return this.reportsService.getDailySummary(user, date);
    }

    @Get('user/:id')
    @ApiOperation({ summary: 'Get report for a specific user' })
    @ApiResponse({ status: 200, description: 'User report.' })
    @ApiQuery({ name: 'startDate', required: false, example: '2023-01-01' })
    @ApiQuery({ name: 'endDate', required: false, example: '2023-01-31' })
    async getUserReport(
        @CurrentUser() user: User,
        @Param('id') userId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getUserReport(user, userId, startDate, endDate);
    }

    @Get('organization')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get organization-wide report (Admin only)' })
    @ApiResponse({ status: 200, description: 'Organization report.' })
    @ApiQuery({ name: 'startDate', required: false, example: '2023-01-01' })
    @ApiQuery({ name: 'endDate', required: false, example: '2023-01-31' })
    async getOrganizationReport(
        @CurrentUser() user: User,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getOrganizationReport(user, startDate, endDate);
    }
}
