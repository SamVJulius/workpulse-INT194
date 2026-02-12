import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Use Pino logger
    app.useLogger(app.get(PinoLogger));

    // Global prefix
    app.setGlobalPrefix('api');

    // Enable CORS
    app.enableCors({
        origin: '*',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Note: Global exception filter and response interceptor are now registered in AppModule

    // Global logging interceptor
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Graceful shutdown
    app.enableShutdownHooks();

    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            logger.log(`Received ${signal}, starting graceful shutdown...`);
            await app.close();
            logger.log('Application closed');
            process.exit(0);
        });
    });

    const port = configService.get<number>('app.port', 3000);
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}/api`);
    logger.log(`Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
