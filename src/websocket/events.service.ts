import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export enum WebSocketEvent {
    USER_ONLINE = 'user:online',
    USER_OFFLINE = 'user:offline',
    SESSION_UPDATE = 'session:update',
    INACTIVE_ALERT = 'alert:inactive',
    OVERTIME_ALERT = 'alert:overtime',
}

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);
    private server: Server;

    setServer(server: Server) {
        this.server = server;
    }

    emitToOrganization(organizationId: string, event: WebSocketEvent, data: any) {
        if (!this.server) {
            this.logger.warn('Socket.IO server not initialized');
            return;
        }

        this.server.to(`org:${organizationId}`).emit(event, data);
        this.logger.debug(`Emitted ${event} to organization ${organizationId}`);
    }

    emitToUser(userId: string, event: WebSocketEvent, data: any) {
        if (!this.server) {
            this.logger.warn('Socket.IO server not initialized');
            return;
        }

        this.server.to(`user:${userId}`).emit(event, data);
        this.logger.debug(`Emitted ${event} to user ${userId}`);
    }

    emitUserOnline(organizationId: string, userId: string, userName: string) {
        this.emitToOrganization(organizationId, WebSocketEvent.USER_ONLINE, {
            userId,
            userName,
            timestamp: new Date().toISOString(),
        });
    }

    emitUserOffline(organizationId: string, userId: string, userName: string) {
        this.emitToOrganization(organizationId, WebSocketEvent.USER_OFFLINE, {
            userId,
            userName,
            timestamp: new Date().toISOString(),
        });
    }

    emitSessionUpdate(organizationId: string, userId: string, sessionData: any) {
        this.emitToUser(userId, WebSocketEvent.SESSION_UPDATE, sessionData);
        this.emitToOrganization(organizationId, WebSocketEvent.SESSION_UPDATE, sessionData);
    }

    emitInactiveAlert(userId: string, sessionId: string, message: string) {
        this.emitToUser(userId, WebSocketEvent.INACTIVE_ALERT, {
            sessionId,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    emitOvertimeAlert(userId: string, sessionId: string, message: string) {
        this.emitToUser(userId, WebSocketEvent.OVERTIME_ALERT, {
            sessionId,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
