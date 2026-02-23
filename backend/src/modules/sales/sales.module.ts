import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { DealService } from './services/deal.service';
import { ForecastService } from './services/forecast.service';
import { SalesComputeService } from './services/sales-compute.service';

@Module({
  imports: [],
  controllers: [SalesController],
  providers: [SalesService, DealService, ForecastService, SalesComputeService],
  exports: [SalesService, DealService, ForecastService, SalesComputeService],
})
export class SalesModule {}
