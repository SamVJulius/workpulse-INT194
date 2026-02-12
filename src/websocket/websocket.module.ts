import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { User } from '@database/entities/user.entity';
import { SessionsModule } from '../modules/sessions/sessions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SessionsModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('app.jwtSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('app.jwtExpiration'),
                },
            }),
        }),
    ],
    providers: [EventsGateway, EventsService, WsJwtGuard],
    exports: [EventsService],
})
export class WebsocketModule { }
