import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add unique request ID to each request for traceability
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Generate or use existing request ID
        const requestId = (req.headers['x-request-id'] as string) || uuidv4();

        // Attach to request object
        (req as any).id = requestId;

        // Add to response headers
        res.setHeader('X-Request-ID', requestId);

        next();
    }
}
