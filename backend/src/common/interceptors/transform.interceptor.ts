import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
    version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  links?: Record<string, string>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    return next.handle().pipe(
      map((responseData) => {
        // If response already has standard format, return as-is
        if (responseData?.success !== undefined) {
          return responseData;
        }

        // Handle paginated responses
        if (responseData?.data && responseData?.pagination) {
          return {
            success: true,
            data: responseData.data,
            meta: {
              request_id: requestId,
              timestamp: new Date().toISOString(),
              version: '1.0',
            },
            pagination: responseData.pagination,
            links: responseData.links,
          };
        }

        // Standard response
        return {
          success: true,
          data: responseData,
          meta: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        };
      }),
    );
  }
}
