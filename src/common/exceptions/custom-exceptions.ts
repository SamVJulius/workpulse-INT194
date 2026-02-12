import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../enums/error-codes.enum';

/**
 * Base custom exception with error code support
 */
export class AppException extends HttpException {
    constructor(
        public readonly errorCode: ErrorCode,
        message?: string,
        public readonly details?: any,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(
            {
                errorCode,
                message: message || ErrorMessages[errorCode],
                details,
            },
            statusCode,
        );
    }
}

/**
 * Authentication and Authorization Exceptions
 */
export class AuthenticationException extends AppException {
    constructor(errorCode: ErrorCode, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.UNAUTHORIZED);
    }
}

export class AuthorizationException extends AppException {
    constructor(errorCode: ErrorCode = ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.FORBIDDEN);
    }
}

/**
 * Resource Not Found Exception
 */
export class ResourceNotFoundException extends AppException {
    constructor(errorCode: ErrorCode, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.NOT_FOUND);
    }
}

/**
 * Conflict Exception (e.g., duplicate resources)
 */
export class ConflictException extends AppException {
    constructor(errorCode: ErrorCode, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.CONFLICT);
    }
}

/**
 * Validation Exception
 */
export class ValidationException extends AppException {
    constructor(message?: string, details?: any) {
        super(ErrorCode.VALIDATION_FAILED, message, details, HttpStatus.BAD_REQUEST);
    }
}

/**
 * Business Logic Exception
 */
export class BusinessLogicException extends AppException {
    constructor(errorCode: ErrorCode, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

/**
 * System/Infrastructure Exception
 */
export class SystemException extends AppException {
    constructor(errorCode: ErrorCode = ErrorCode.SYSTEM_INTERNAL_ERROR, message?: string, details?: any) {
        super(errorCode, message, details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
