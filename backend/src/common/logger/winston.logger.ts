import { LoggerService, Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, context, trace, ...meta }) => {
  let msg = `${timestamp} [${level}]`;
  if (context) {
    msg += ` [${context}]`;
  }
  msg += `: ${message}`;
  if (Object.keys(meta).length > 0) {
    msg += ` ${JSON.stringify(meta)}`;
  }
  if (trace) {
    msg += `\n${trace}`;
  }
  return msg;
});

// Custom format for file output (JSON)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  json(),
);

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      defaultMeta: {
        service: 'aether-api',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: combine(
            colorize({ all: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            errors({ stack: true }),
            consoleFormat,
          ),
        }),
      ],
    });

    // Add file transports in production
    if (isProduction) {
      // Rotating file for all logs
      this.logger.add(
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat,
        }),
      );

      // Separate file for errors
      this.logger.add(
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: fileFormat,
        }),
      );
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Extended logging methods
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  http(message: string, meta?: Record<string, any>): void {
    this.logger.http(message, { context: this.context, ...meta });
  }

  // Log with structured data
  logWithMeta(level: string, message: string, meta: Record<string, any>): void {
    this.logger.log(level, message, { context: this.context, ...meta });
  }

  // Log request/response for HTTP
  logHttpRequest(req: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    ip?: string;
    userId?: string;
  }): void {
    this.logger.http('Incoming request', {
      context: 'HTTP',
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.userId,
      userAgent: req.headers?.['user-agent'],
      requestId: req.headers?.['x-request-id'],
    });
  }

  logHttpResponse(res: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
    requestId?: string;
  }): void {
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    this.logger.log(level, 'Response sent', {
      context: 'HTTP',
      method: res.method,
      url: res.url,
      statusCode: res.statusCode,
      duration: `${res.duration}ms`,
      userId: res.userId,
      requestId: res.requestId,
    });
  }

  // Log security events
  logSecurityEvent(event: {
    type: string;
    userId?: string;
    ip?: string;
    details?: Record<string, any>;
  }): void {
    this.logger.warn('Security event', {
      context: 'SECURITY',
      eventType: event.type,
      userId: event.userId,
      ip: event.ip,
      ...event.details,
    });
  }

  // Log audit events
  logAuditEvent(event: {
    action: string;
    userId: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, any>;
  }): void {
    this.logger.info('Audit event', {
      context: 'AUDIT',
      action: event.action,
      userId: event.userId,
      resource: event.resource,
      resourceId: event.resourceId,
      changes: event.changes,
    });
  }

  // Get underlying Winston logger for advanced use cases
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

// Factory for creating logger instances with context
export const createLogger = (context: string): WinstonLogger => {
  const logger = new WinstonLogger();
  logger.setContext(context);
  return logger;
};
