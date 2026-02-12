import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSession, SessionStatus } from '@database/entities/work-session.entity';
import { User } from '@database/entities/user.entity';
import { StartSessionDto, StopSessionDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
    ) { }

    async startSession(user: User, startSessionDto: StartSessionDto): Promise<WorkSession> {
        // Check if user has an active session
        const activeSession = await this.sessionRepository.findOne({
            where: {
                user_id: user.id,
                status: SessionStatus.ACTIVE,
            },
        });

        if (activeSession) {
            throw new BadRequestException('User already has an active session');
        }

        const session = this.sessionRepository.create({
            user_id: user.id,
            organization_id: user.organization_id,
            project_id: startSessionDto.project_id,
            start_time: startSessionDto.start_time ? new Date(startSessionDto.start_time) : new Date(),
            status: SessionStatus.ACTIVE,
            total_active_seconds: 0,
            total_idle_seconds: 0,
        });

        const savedSession = await this.sessionRepository.save(session);
        this.logger.log(`Session started: ${savedSession.id} for user: ${user.id}`);

        return savedSession;
    }

    async stopSession(sessionId: string, user: User, stopSessionDto: StopSessionDto): Promise<WorkSession> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.user_id !== user.id) {
            throw new ForbiddenException('You can only stop your own sessions');
        }

        if (session.status === SessionStatus.STOPPED) {
            throw new BadRequestException('Session is already stopped');
        }

        session.status = SessionStatus.STOPPED;
        session.end_time = stopSessionDto.end_time ? new Date(stopSessionDto.end_time) : new Date();

        const updatedSession = await this.sessionRepository.save(session);
        this.logger.log(`Session stopped: ${sessionId}`);

        return updatedSession;
    }

    async getActiveSession(user: User): Promise<WorkSession | null> {
        return this.sessionRepository.findOne({
            where: {
                user_id: user.id,
                status: SessionStatus.ACTIVE,
            },
            relations: ['project'],
        });
    }

    async getSessionById(sessionId: string, user: User): Promise<WorkSession> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
            relations: ['project', 'user'],
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Users can only access their own sessions, admins can access all in their org
        if (session.user_id !== user.id && session.organization_id !== user.organization_id) {
            throw new ForbiddenException('Access denied');
        }

        return session;
    }

    async updateSessionTotals(
        sessionId: string,
        activeSeconds: number,
        idleSeconds: number,
    ): Promise<WorkSession> {
        let retries = 3;
        let lastError: any = new Error('Unknown error during updateSessionTotals');

        while (retries > 0) {
            try {
                const session = await this.sessionRepository.findOne({
                    where: { id: sessionId },
                });

                if (!session) {
                    throw new NotFoundException('Session not found');
                }

                if (session.status === SessionStatus.STOPPED) {
                    throw new BadRequestException('Cannot update stopped session');
                }

                session.total_active_seconds += activeSeconds;
                session.total_idle_seconds += idleSeconds;
                session.last_activity_at = new Date();

                return await this.sessionRepository.save(session);
            } catch (error) {
                lastError = error;
                if (error.message?.includes('version')) {
                    // Optimistic lock failure, retry
                    retries--;
                    this.logger.warn(`Optimistic lock conflict for session ${sessionId}, retrying... (${retries} left)`);
                    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay before retry
                } else {
                    throw error;
                }
            }
        }

        throw new BadRequestException(`Failed to update session after retries: ${lastError.message}`);
    }
}
