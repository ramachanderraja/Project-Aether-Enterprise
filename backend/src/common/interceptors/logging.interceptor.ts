import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const { method, url, body, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const tenantId = request.headers['x-tenant-id'] as string;

    const startTime = Date.now();

    // Set request ID in response header
    response.setHeader('X-Request-ID', requestId);

    this.logger.log({
      message: 'Incoming request',
      requestId,
      method,
      url,
      ip,
      userAgent: userAgent.substring(0, 100),
      tenantId,
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          this.logger.log({
            message: 'Request completed',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error({
            message: 'Request failed',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
