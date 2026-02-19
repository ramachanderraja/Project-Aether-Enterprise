import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host') || 'localhost';
        const port = configService.get<number>('redis.port') || 6379;
        const password = configService.get<string>('redis.password');

        // Skip Redis connection if REDIS_ENABLED is explicitly set to false
        const redisEnabled = configService.get<string>('REDIS_ENABLED', 'false');
        if (redisEnabled === 'false') {
          console.log('Redis is disabled via REDIS_ENABLED=false, skipping connection');
          return null;
        }

        console.log(`Connecting to Redis at ${host}:${port}`);

        // Check if this is Azure Redis (uses .redis.cache.windows.net)
        const isAzureRedis = host.includes('.redis.cache.windows.net');

        const redisOptions: any = {
          host,
          port,
          password,
          maxRetriesPerRequest: 3,
          lazyConnect: true, // Don't connect immediately
          retryStrategy: (times: number) => {
            console.log(`Redis retry attempt ${times}`);
            if (times > 3) {
              console.log('Redis max retries reached, giving up');
              return null;
            }
            return Math.min(times * 200, 1000);
          },
        };

        // Azure Redis requires TLS on port 6380
        if (isAzureRedis || port === 6380) {
          console.log('Using TLS for Azure Redis connection');
          redisOptions.tls = {
            servername: host,
          };
        }

        const redis = new Redis(redisOptions);

        redis.on('connect', () => {
          console.log('Redis connected successfully');
        });

        redis.on('error', (err) => {
          console.error('Redis connection error:', err.message);
        });

        redis.on('ready', () => {
          console.log('Redis is ready');
        });

        // Try to connect but don't block app startup
        redis.connect().catch((err) => {
          console.error('Redis initial connection failed:', err.message);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
