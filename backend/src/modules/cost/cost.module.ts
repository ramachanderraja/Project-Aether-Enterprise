import { Module } from '@nestjs/common';
import { CostController } from './cost.controller';
import { CostService } from './cost.service';

@Module({
  imports: [],
  controllers: [CostController],
  providers: [CostService],
  exports: [CostService],
})
export class CostModule {}
