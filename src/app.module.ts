import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { WebsocketModule } from './websocket/websocket.module';
import { JobsModule } from './jobs/jobs.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig],
        }),
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                pinoHttp: {
                    level: configService.get<string>('app.logLevel', 'info'),
                    transport:
                        configService.get<string>('app.nodeEnv') === 'development'
                            ? {
                                target: 'pino-pretty',
                                options: {
                                    colorize: true,
                                    singleLine: true,
                                },
                            }
                            : undefined,
                    // Add request ID to logs
                    customProps: (req: any) => ({
                        requestId: req.id,
                    }),
                },
            }),
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get<any>('database'),
        }),
        AuthModule,
        SessionsModule,
        ActivityModule,
        ProjectsModule,
        ReportsModule,
        HealthModule,
        UsersModule,
        WebsocketModule,
        JobsModule,
    ],
    providers: [
        // Global exception filter
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        // Global response transformer
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply request ID middleware to all routes
        consumer.apply(RequestIdMiddleware).forRoutes('*');
    }
}
