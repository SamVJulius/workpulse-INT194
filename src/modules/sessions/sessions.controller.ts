import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { StartSessionDto, StopSessionDto } from './dto/session.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Post('start')
    async startSession(
        @CurrentUser() user: User,
        @Body() startSessionDto: StartSessionDto,
    ) {
        return this.sessionsService.startSession(user, startSessionDto);
    }

    @Post(':id/stop')
    async stopSession(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() stopSessionDto: StopSessionDto,
    ) {
        return this.sessionsService.stopSession(id, user, stopSessionDto);
    }

    @Get('active')
    async getActiveSession(@CurrentUser() user: User) {
        return this.sessionsService.getActiveSession(user);
    }
}
