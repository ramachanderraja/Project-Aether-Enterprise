import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CostService } from './cost.service';
import { GetCostDto } from './dto';

@ApiTags('Cost')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cost')
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get cost overview' })
  @ApiResponse({ status: 200, description: 'Cost overview retrieved' })
  async getOverview(@Query() query: GetCostDto) {
    return this.costService.getCostOverview(query);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get vendor spend analysis' })
  async getVendorSpend(@Query() query: GetCostDto) {
    return this.costService.getVendorSpend(query);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get cost drivers analysis' })
  async getCostDrivers(@Query() query: GetCostDto) {
    return this.costService.getCostDrivers(query);
  }

  @Get('optimizations')
  @ApiOperation({ summary: 'Get optimization opportunities' })
  async getOptimizations() {
    return this.costService.getOptimizations();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get cost trends' })
  async getTrends(@Query() query: GetCostDto) {
    return this.costService.getCostTrends(query);
  }
}
