import { ErrorCode } from '../enums/error-codes.enum';

/**
 * Standardized API Response for successful operations
 */
export class ApiSuccessResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
    requestId?: string;

    constructor(data: T, requestId?: string) {
        this.success = true;
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;
    }
}

/**
 * Standardized API Response for errors
 */
export class ApiErrorResponse {
    success: boolean;
    error: {
        code: ErrorCode;
        message: string;
        details?: any;
        timestamp: string;
        path?: string;
        requestId?: string;
    };

    constructor(
        code: ErrorCode,
        message: string,
        details?: any,
        path?: string,
        requestId?: string,
    ) {
        this.success = false;
        this.error = {
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
            path,
            requestId,
        };
    }
}

/**
 * Validation Error Detail
 */
export interface ValidationErrorDetail {
    field: string;
    constraints: string[];
    value?: any;
}
