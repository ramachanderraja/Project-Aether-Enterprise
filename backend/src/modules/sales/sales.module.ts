import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { DealService } from './services/deal.service';
import { ForecastService } from './services/forecast.service';

@Module({
  imports: [],
  controllers: [SalesController],
  providers: [SalesService, DealService, ForecastService],
  exports: [SalesService, DealService, ForecastService],
})
export class SalesModule {}
