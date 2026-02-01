import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MetricsModule } from '../../common/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [HealthController],
})
export class HealthModule {}
