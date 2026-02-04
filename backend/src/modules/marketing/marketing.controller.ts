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
import { MarketingService } from './marketing.service';

@ApiTags('Marketing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get marketing overview metrics' })
  @ApiResponse({ status: 200, description: 'Marketing overview retrieved' })
  async getOverview() {
    return this.marketingService.getMarketingOverview();
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Get marketing funnel data' })
  @ApiResponse({ status: 200, description: 'Funnel data retrieved' })
  async getFunnel() {
    return this.marketingService.getMarketingFunnel();
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get channel performance data' })
  @ApiResponse({ status: 200, description: 'Channel data retrieved' })
  async getChannels() {
    return this.marketingService.getChannelPerformance();
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get campaign performance data' })
  @ApiResponse({ status: 200, description: 'Campaign data retrieved' })
  async getCampaigns(@Query('status') status?: string) {
    return this.marketingService.getCampaigns(status);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get lead generation trends' })
  @ApiResponse({ status: 200, description: 'Trends retrieved' })
  async getTrends(@Query('period') period?: string) {
    return this.marketingService.getLeadTrends(period);
  }

  @Get('acquisition')
  @ApiOperation({ summary: 'Get customer acquisition metrics' })
  @ApiResponse({ status: 200, description: 'Acquisition data retrieved' })
  async getAcquisition() {
    return this.marketingService.getAcquisitionMetrics();
  }
}
