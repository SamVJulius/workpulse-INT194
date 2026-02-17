import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { StartSessionDto, StopSessionDto } from './dto/session.dto';

@ApiTags('Work Sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Post('start')
    @ApiOperation({ summary: 'Start a new work session' })
    @ApiResponse({ status: 201, description: 'Session successfully started.' })
    async startSession(
        @CurrentUser() user: User,
        @Body() startSessionDto: StartSessionDto,
    ) {
        return this.sessionsService.startSession(user, startSessionDto);
    }

    @Post(':id/stop')
    @ApiOperation({ summary: 'Stop an active work session' })
    @ApiResponse({ status: 200, description: 'Session successfully stopped.' })
    async stopSession(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() stopSessionDto: StopSessionDto,
    ) {
        return this.sessionsService.stopSession(id, user, stopSessionDto);
    }

    @Get('active')
    @ApiOperation({ summary: 'Get current active session for the user' })
    @ApiResponse({ status: 200, description: 'Current active session.' })
    async getActiveSession(@CurrentUser() user: User) {
        return this.sessionsService.getActiveSession(user);
    }
}
