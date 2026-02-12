import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'workpulse',
        password: process.env.DB_PASSWORD || 'workpulse_password',
        database: process.env.DB_DATABASE || 'workpulse',
        entities: [join(__dirname, '..', 'database', 'entities', '*.entity{.ts,.js}')],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
);
