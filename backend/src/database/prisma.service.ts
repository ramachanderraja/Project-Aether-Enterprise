import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService that extends PrismaClient for real DB access.
 * When DATABASE_URL is not set, the app runs in "file-based" mode
 * where CSV data is served from disk via the DataService instead.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private _connected = false;

  constructor() {
    super({
      datasources: process.env.DATABASE_URL
        ? { db: { url: process.env.DATABASE_URL } }
        : undefined,
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  get isConnected(): boolean {
    return this._connected;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL not set – running without database (file-based mode)',
      );
      return;
    }

    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this._connected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`);
      this._connected = false;
    }
  }

  async onModuleDestroy() {
    if (this._connected) {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    }
  }
}
