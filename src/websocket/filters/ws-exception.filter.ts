import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { ErrorCode, ErrorMessages } from '../../common/enums/error-codes.enum';

/**
 * WebSocket Exception Filter for consistent error formatting
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();

        let errorCode: ErrorCode;
        let message: string;
        let details: any;

        if (exception instanceof WsException) {
            const error = exception.getError();
            if (typeof error === 'object' && error !== null) {
                errorCode = (error as any).errorCode || ErrorCode.SYSTEM_INTERNAL_ERROR;
                message = (error as any).message || 'WebSocket error occurred';
                details = (error as any).details;
            } else {
                errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR;
                message = typeof error === 'string' ? error : 'WebSocket error occurred';
            }
        } else if (exception instanceof Error) {
            errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR;
            message = exception.message;
        } else {
            errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR;
            message = 'Unknown WebSocket error';
        }

        // Send standardized error to client
        client.emit('error', {
            success: false,
            error: {
                code: errorCode,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
