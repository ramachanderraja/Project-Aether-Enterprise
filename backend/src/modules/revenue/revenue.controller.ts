import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RevenueService } from './revenue.service';

@ApiTags('Revenue')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get revenue overview' })
  async getOverview(@Query('period') period?: string) {
    return this.revenueService.getRevenueOverview(period);
  }

  @Get('arr-movement')
  @ApiOperation({ summary: 'Get ARR movement analysis' })
  async getArrMovement(@Query('period') period?: string) {
    return this.revenueService.getArrMovement(period);
  }

  @Get('customer-health')
  @ApiOperation({ summary: 'Get customer health scores' })
  async getCustomerHealth(@Query('risk_level') riskLevel?: string) {
    return this.revenueService.getCustomerHealth(riskLevel);
  }

  @Get('cohort-analysis')
  @ApiOperation({ summary: 'Get cohort analysis' })
  async getCohortAnalysis() {
    return this.revenueService.getCohortAnalysis();
  }

  @Get('churn-analysis')
  @ApiOperation({ summary: 'Get churn analysis' })
  async getChurnAnalysis() {
    return this.revenueService.getChurnAnalysis();
  }
}
