import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client = context.switchToWs().getClient();
            const token = this.extractTokenFromHandshake(client);

            if (!token) {
                throw new WsException('Unauthorized');
            }

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('app.jwtSecret') || 'secret',
            });

            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
                relations: ['organization'],
            });

            if (!user) {
                throw new WsException('User not found');
            }

            client.data.user = user;
            return true;
        } catch (error) {
            this.logger.error(`WebSocket authentication failed: ${error.message}`);
            throw new WsException('Unauthorized');
        }
    }

    private extractTokenFromHandshake(client: any): string | null {
        const authHeader = client.handshake?.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        const token = client.handshake?.auth?.token;
        if (token) {
            return token;
        }

        return null;
    }
}
