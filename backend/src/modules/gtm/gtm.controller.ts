import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GTMService } from './gtm.service';

@ApiTags('GTM')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gtm')
export class GTMController {
  constructor(private readonly gtmService: GTMService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get GTM metrics overview' })
  @ApiResponse({ status: 200, description: 'GTM metrics retrieved' })
  async getMetrics() {
    return this.gtmService.getGTMMetrics();
  }

  @Get('unit-economics')
  @ApiOperation({ summary: 'Get unit economics data' })
  @ApiResponse({ status: 200, description: 'Unit economics retrieved' })
  async getUnitEconomics() {
    return this.gtmService.getUnitEconomics();
  }

  @Get('ltv-cac-trend')
  @ApiOperation({ summary: 'Get LTV:CAC ratio trend' })
  @ApiResponse({ status: 200, description: 'LTV:CAC trend retrieved' })
  async getLtvCacTrend(@Query('period') period?: string) {
    return this.gtmService.getLtvCacTrend(period);
  }

  @Get('cohort-retention')
  @ApiOperation({ summary: 'Get cohort retention analysis' })
  @ApiResponse({ status: 200, description: 'Cohort retention data retrieved' })
  async getCohortRetention() {
    return this.gtmService.getCohortRetention();
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get industry benchmarks comparison' })
  @ApiResponse({ status: 200, description: 'Benchmarks retrieved' })
  async getBenchmarks() {
    return this.gtmService.getIndustryBenchmarks();
  }

  @Get('health-summary')
  @ApiOperation({ summary: 'Get GTM health summary' })
  @ApiResponse({ status: 200, description: 'Health summary retrieved' })
  async getHealthSummary() {
    return this.gtmService.getHealthSummary();
  }
}
