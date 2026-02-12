import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ValidationErrorDetail } from '../dto/api-response.dto';
import { ErrorCode } from '../enums/error-codes.enum';
import { AppException } from '../exceptions/custom-exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Extract request ID if available
        const requestId = (request as any).id || 'unknown';

        let status: HttpStatus;
        let errorCode: ErrorCode;
        let message: string;
        let details: any;

        // Handle different exception types
        if (exception instanceof AppException) {
            // Our custom exceptions
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;
            errorCode = exceptionResponse.errorCode;
            message = exceptionResponse.message;
            details = exceptionResponse.details;
        } else if (exception instanceof HttpException) {
            // NestJS built-in HTTP exceptions
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // Handle validation errors from class-validator
            if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
                const validationErrors = (exceptionResponse as any).message;
                if (Array.isArray(validationErrors)) {
                    errorCode = ErrorCode.VALIDATION_FAILED;
                    message = 'Validation failed';
                    details = this.formatValidationErrors(validationErrors);
                } else {
                    errorCode = ErrorCode.VALIDATION_FAILED;
                    message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message || 'Bad request';
                }
            } else {
                errorCode = this.mapHttpStatusToErrorCode(status);
                message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message || 'An error occurred';
            }
        } else {
            // Unknown errors (should be rare in production)
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR;
            message = 'An unexpected error occurred';

            // Log the full error for debugging
            this.logger.error(
                `Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        // Create standardized error response
        const errorResponse = new ApiErrorResponse(
            errorCode,
            message,
            details,
            request.url,
            requestId,
        );

        // Log error (but don't expose stack traces in production)
        const isProduction = process.env.NODE_ENV === 'production';

        if (!isProduction && exception instanceof Error) {
            this.logger.error(
                `${request.method} ${request.url} - Status: ${status} - ${message}`,
                exception.stack,
            );
        } else {
            this.logger.error(
                `${request.method} ${request.url} - Status: ${status} - ${message} - RequestID: ${requestId}`,
            );
        }

        response.status(status).json(errorResponse);
    }

    /**
     * Format class-validator errors into a structured format
     */
    private formatValidationErrors(errors: any[]): ValidationErrorDetail[] {
        return errors.map((error) => {
            if (typeof error === 'string') {
                return {
                    field: 'unknown',
                    constraints: [error],
                };
            }

            return {
                field: error.property || 'unknown',
                constraints: error.constraints ? Object.values(error.constraints) : [],
                value: error.value,
            };
        });
    }

    /**
     * Map HTTP status codes to error codes
     */
    private mapHttpStatusToErrorCode(status: HttpStatus): ErrorCode {
        switch (status) {
            case HttpStatus.UNAUTHORIZED:
                return ErrorCode.AUTH_INVALID_TOKEN;
            case HttpStatus.FORBIDDEN:
                return ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
            case HttpStatus.NOT_FOUND:
                return ErrorCode.SESSION_NOT_FOUND;
            case HttpStatus.CONFLICT:
                return ErrorCode.AUTH_USER_EXISTS;
            case HttpStatus.BAD_REQUEST:
                return ErrorCode.VALIDATION_FAILED;
            case HttpStatus.SERVICE_UNAVAILABLE:
                return ErrorCode.SYSTEM_SERVICE_UNAVAILABLE;
            default:
                return ErrorCode.SYSTEM_INTERNAL_ERROR;
        }
    }
}
