import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    appName: process.env.APP_NAME || 'WorkPulse',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
    logLevel: process.env.LOG_LEVEL || 'info',
    inactiveThresholdSeconds: parseInt(process.env.INACTIVE_THRESHOLD_SECONDS || '60', 10),
    idleThresholdSeconds: parseInt(process.env.IDLE_THRESHOLD_SECONDS || '300', 10),
    overtimeThresholdHours: parseInt(process.env.OVERTIME_THRESHOLD_HOURS || '9', 10),
    maxBulkActivities: parseInt(process.env.MAX_BULK_ACTIVITIES || '1000', 10),
}));
