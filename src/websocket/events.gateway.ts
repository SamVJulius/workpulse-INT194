import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { EventsService } from './events.service';
import { SessionsService } from '../modules/sessions/sessions.service';
import { User } from '@database/entities/user.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    constructor(
        private eventsService: EventsService,
        private sessionsService: SessionsService,
    ) { }

    afterInit(server: Server) {
        this.eventsService.setServer(server);
        this.logger.log('WebSocket Gateway initialized');
    }

    @UseGuards(WsJwtGuard)
    async handleConnection(client: Socket) {
        try {
            const user: User = client.data.user;

            if (!user) {
                client.disconnect();
                return;
            }

            // Join organization room
            client.join(`org:${user.organization_id}`);

            // Join user-specific room
            client.join(`user:${user.id}`);

            this.logger.log(`Client connected: ${client.id} (User: ${user.name})`);

            // Emit user online event
            this.eventsService.emitUserOnline(user.organization_id, user.id, user.name);

            // Send current session state
            const activeSession = await this.sessionsService.getActiveSession(user);
            if (activeSession) {
                client.emit('session:state', activeSession);
            }
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const user: User = client.data.user;

        if (user) {
            this.logger.log(`Client disconnected: ${client.id} (User: ${user.name})`);
            this.eventsService.emitUserOffline(user.organization_id, user.id, user.name);
        }
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket): string {
        return 'pong';
    }

    @SubscribeMessage('session:request-state')
    @UseGuards(WsJwtGuard)
    async handleSessionStateRequest(@ConnectedSocket() client: Socket) {
        const user: User = client.data.user;
        const activeSession = await this.sessionsService.getActiveSession(user);

        if (activeSession) {
            client.emit('session:state', activeSession);
        } else {
            client.emit('session:state', null);
        }
    }
}
