import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../dto/api-response.dto';

/**
 * Transform all successful responses into standardized format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const requestId = (request as any).id;

        return next.handle().pipe(
            map((data) => new ApiSuccessResponse(data, requestId)),
        );
    }
}
