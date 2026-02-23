import { Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { RevenueComputeService } from './services/revenue-compute.service';

@Module({
  imports: [],
  controllers: [RevenueController],
  providers: [RevenueService, RevenueComputeService],
  exports: [RevenueService, RevenueComputeService],
})
export class RevenueModule {}
