import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AnomalyService } from './services/anomaly.service';
import { KpiService } from './services/kpi.service';

@Module({
  imports: [],
  controllers: [DashboardController],
  providers: [DashboardService, AnomalyService, KpiService],
  exports: [DashboardService],
})
export class DashboardModule {}
