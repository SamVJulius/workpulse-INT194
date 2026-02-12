/**
 * Centralized Error Codes for WorkPulse API
 * 
 * Format: DOMAIN_ERROR_TYPE
 * - AUTH_* : Authentication and authorization errors
 * - SESSION_* : Work session related errors
 * - ACTIVITY_* : Activity logging errors
 * - PROJECT_* : Project management errors
 * - REPORT_* : Reporting errors
 * - VALIDATION_* : Input validation errors
 * - SYSTEM_* : System and infrastructure errors
 */

export enum ErrorCode {
    // Authentication & Authorization (1xxx)
    AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
    AUTH_USER_EXISTS = 'AUTH_USER_EXISTS',
    AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
    AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
    AUTH_ORGANIZATION_REQUIRED = 'AUTH_ORGANIZATION_REQUIRED',

    // Session Management (2xxx)
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_ALREADY_ACTIVE = 'SESSION_ALREADY_ACTIVE',
    SESSION_ALREADY_STOPPED = 'SESSION_ALREADY_STOPPED',
    SESSION_UNAUTHORIZED = 'SESSION_UNAUTHORIZED',
    SESSION_INVALID_TIMESTAMP = 'SESSION_INVALID_TIMESTAMP',
    SESSION_UPDATE_FAILED = 'SESSION_UPDATE_FAILED',

    // Activity Logging (3xxx)
    ACTIVITY_INVALID_TIMESTAMP = 'ACTIVITY_INVALID_TIMESTAMP',
    ACTIVITY_SESSION_STOPPED = 'ACTIVITY_SESSION_STOPPED',
    ACTIVITY_DUPLICATE = 'ACTIVITY_DUPLICATE',
    ACTIVITY_INVALID_TYPE = 'ACTIVITY_INVALID_TYPE',

    // Project Management (4xxx)
    PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
    PROJECT_UNAUTHORIZED = 'PROJECT_UNAUTHORIZED',
    PROJECT_NAME_REQUIRED = 'PROJECT_NAME_REQUIRED',

    // Reporting (5xxx)
    REPORT_INVALID_DATE_RANGE = 'REPORT_INVALID_DATE_RANGE',
    REPORT_USER_NOT_FOUND = 'REPORT_USER_NOT_FOUND',
    REPORT_UNAUTHORIZED = 'REPORT_UNAUTHORIZED',

    // Validation (6xxx)
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    VALIDATION_INVALID_UUID = 'VALIDATION_INVALID_UUID',
    VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
    VALIDATION_INVALID_DATE = 'VALIDATION_INVALID_DATE',

    // System & Infrastructure (9xxx)
    SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
    SYSTEM_DATABASE_ERROR = 'SYSTEM_DATABASE_ERROR',
    SYSTEM_REDIS_ERROR = 'SYSTEM_REDIS_ERROR',
    SYSTEM_SERVICE_UNAVAILABLE = 'SYSTEM_SERVICE_UNAVAILABLE',
}

export const ErrorMessages: Record<ErrorCode, string> = {
    // Authentication
    [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCode.AUTH_USER_EXISTS]: 'User already exists in this organization',
    [ErrorCode.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
    [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
    [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions to perform this action',
    [ErrorCode.AUTH_ORGANIZATION_REQUIRED]: 'Organization name is required when creating a new organization',

    // Sessions
    [ErrorCode.SESSION_NOT_FOUND]: 'Work session not found',
    [ErrorCode.SESSION_ALREADY_ACTIVE]: 'You already have an active session',
    [ErrorCode.SESSION_ALREADY_STOPPED]: 'Cannot log activity for stopped session',
    [ErrorCode.SESSION_UNAUTHORIZED]: 'You can only access your own sessions',
    [ErrorCode.SESSION_INVALID_TIMESTAMP]: 'Activity timestamp is outside session bounds',
    [ErrorCode.SESSION_UPDATE_FAILED]: 'Failed to update session totals',

    // Activity
    [ErrorCode.ACTIVITY_INVALID_TIMESTAMP]: 'Activity timestamp cannot be in the future',
    [ErrorCode.ACTIVITY_SESSION_STOPPED]: 'Cannot log activity for stopped session',
    [ErrorCode.ACTIVITY_DUPLICATE]: 'Activity with this ID already exists',
    [ErrorCode.ACTIVITY_INVALID_TYPE]: 'Activity type must be "active" or "idle"',

    // Projects
    [ErrorCode.PROJECT_NOT_FOUND]: 'Project not found',
    [ErrorCode.PROJECT_UNAUTHORIZED]: 'You can only access projects in your organization',
    [ErrorCode.PROJECT_NAME_REQUIRED]: 'Project name is required',

    // Reports
    [ErrorCode.REPORT_INVALID_DATE_RANGE]: 'Invalid date range provided',
    [ErrorCode.REPORT_USER_NOT_FOUND]: 'User not found',
    [ErrorCode.REPORT_UNAUTHORIZED]: 'You can only view your own reports',

    // Validation
    [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
    [ErrorCode.VALIDATION_INVALID_UUID]: 'Invalid UUID format',
    [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Invalid email format',
    [ErrorCode.VALIDATION_INVALID_DATE]: 'Invalid date format',

    // System
    [ErrorCode.SYSTEM_INTERNAL_ERROR]: 'An internal server error occurred',
    [ErrorCode.SYSTEM_DATABASE_ERROR]: 'Database operation failed',
    [ErrorCode.SYSTEM_REDIS_ERROR]: 'Cache service error',
    [ErrorCode.SYSTEM_SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
};
