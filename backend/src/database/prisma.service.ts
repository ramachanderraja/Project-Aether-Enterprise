import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

/**
 * PrismaService that gracefully handles missing DATABASE_URL.
 * When no database is configured, the app runs in "file-based" mode
 * where CSV data is served from disk via the DataService instead.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _connected = false;

  get isConnected(): boolean {
    return this._connected;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL not set – running without database (file-based mode)');
      return;
    }

    try {
      this.logger.log('Connecting to database...');
      this.logger.log(`DATABASE_URL configured: Yes`);
      // In file-based mode we skip the actual connection
      // If a real PrismaClient is needed, uncomment and import @prisma/client
      this._connected = false;
      this.logger.warn('Database connection skipped – running in file-based mode');
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('PrismaService destroyed');
  }
}
