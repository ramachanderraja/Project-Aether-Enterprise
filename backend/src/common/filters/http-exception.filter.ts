import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
    trace_id: string;
  };
  meta: {
    request_id: string;
    timestamp: string;
    path: string;
    method: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const traceId = uuidv4();

    let status: number;
    let message: string;
    let code: string;
    let details: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        code = this.getErrorCode(status, responseObj.error);
        details = Array.isArray(responseObj.message) ? responseObj.message : undefined;
        if (details) {
          message = 'Validation failed';
        }
      } else {
        message = exceptionResponse;
        code = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_ERROR';

      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        { requestId, traceId },
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      code = 'UNKNOWN_ERROR';
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        trace_id: traceId,
      },
      meta: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // Log error for non-client errors
    if (status >= 500) {
      this.logger.error(`${code}: ${message}`, { requestId, traceId, status });
    } else {
      this.logger.warn(`${code}: ${message}`, { requestId, status });
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number, error?: string): string {
    if (error) {
      return error.toUpperCase().replace(/ /g, '_');
    }

    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
