import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentGateway } from './agent.gateway';
import { AgentService } from './agent.service';
import { SalesModule } from '../sales/sales.module';
import { RevenueModule } from '../revenue/revenue.module';

@Module({
  imports: [ConfigModule, SalesModule, RevenueModule],
  controllers: [AgentController],
  providers: [AgentService, AgentGateway],
  exports: [AgentService],
})
export class AgentModule {}
