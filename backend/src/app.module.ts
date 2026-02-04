import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AIModule } from './modules/ai/ai.module';
import { SalesModule } from './modules/sales/sales.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { GTMModule } from './modules/gtm/gtm.module';
import { CostModule } from './modules/cost/cost.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { TrainingModule } from './modules/training/training.module';
import { DataFabricModule } from './modules/data-fabric/data-fabric.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportModule } from './modules/import/import.module';

// Infrastructure modules
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './config/redis.module';
import { HealthModule } from './modules/health/health.module';

// Configuration
import configuration from './config/configuration';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 60,
        },
      ]),
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,
    RedisModule,
    HealthModule,

    // Feature modules
    AuthModule,
    DashboardModule,
    AIModule,
    SalesModule,
    MarketingModule,
    GTMModule,
    CostModule,
    RevenueModule,
    ScenariosModule,
    IntelligenceModule,
    GovernanceModule,
    TrainingModule,
    DataFabricModule,
    IntegrationsModule,
    UsersModule,
    ReportsModule,
    ImportModule,
  ],
})
export class AppModule {}
