import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@database/entities/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('daily')
    async getDailySummary(
        @CurrentUser() user: User,
        @Query('date') date: string,
    ) {
        return this.reportsService.getDailySummary(user, date);
    }

    @Get('user/:id')
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
    async getOrganizationReport(
        @CurrentUser() user: User,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getOrganizationReport(user, startDate, endDate);
    }
}
