import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
    private redis: Redis;

    constructor(
        @InjectDataSource()
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        this.redis = new Redis({
            host: this.configService.get<string>('redis.host'),
            port: this.configService.get<number>('redis.port'),
            password: this.configService.get<string>('redis.password'),
        });
    }

    @Get()
    async check() {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'unknown',
                redis: 'unknown',
            },
        };

        // Check database
        try {
            await this.dataSource.query('SELECT 1');
            health.services.database = 'healthy';
        } catch (error) {
            health.services.database = 'unhealthy';
            health.status = 'degraded';
        }

        // Check Redis
        try {
            await this.redis.ping();
            health.services.redis = 'healthy';
        } catch (error) {
            health.services.redis = 'unhealthy';
            health.status = 'degraded';
        }

        return health;
    }
}
