import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { DealService } from './services/deal.service';
import { ForecastService } from './services/forecast.service';
import { GetPipelineDto, GetDealsDto, UpdateDealDto, CreateDealDto } from './dto';

@ApiTags('Sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly dealService: DealService,
    private readonly forecastService: ForecastService,
  ) {}

  @Get('pipeline')
  @ApiOperation({ summary: 'Get sales pipeline overview' })
  @ApiResponse({ status: 200, description: 'Pipeline data retrieved' })
  async getPipeline(@Query() query: GetPipelineDto) {
    return this.salesService.getPipelineOverview(query);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get list of deals' })
  @ApiResponse({ status: 200, description: 'Deals retrieved' })
  async getDeals(@Query() query: GetDealsDto) {
    return this.dealService.getDeals(query);
  }

  @Get('deals/:dealId')
  @ApiOperation({ summary: 'Get deal details' })
  @ApiResponse({ status: 200, description: 'Deal details retrieved' })
  async getDealDetails(@Param('dealId') dealId: string) {
    return this.dealService.getDealById(dealId);
  }

  @Post('deals')
  @ApiOperation({ summary: 'Create new deal' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  async createDeal(@Body() createDto: CreateDealDto) {
    return this.dealService.createDeal(createDto);
  }

  @Patch('deals/:dealId')
  @ApiOperation({ summary: 'Update deal' })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  async updateDeal(
    @Param('dealId') dealId: string,
    @Body() updateDto: UpdateDealDto,
  ) {
    return this.dealService.updateDeal(dealId, updateDto);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get AI-powered sales forecast' })
  @ApiResponse({ status: 200, description: 'Forecast retrieved' })
  async getForecast(@Query() query: GetPipelineDto) {
    return this.forecastService.getForecast(query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get sales metrics and KPIs' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  async getMetrics(@Query() query: GetPipelineDto) {
    return this.salesService.getSalesMetrics(query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get sales trends' })
  @ApiResponse({ status: 200, description: 'Trends retrieved' })
  async getTrends(@Query() query: GetPipelineDto) {
    return this.salesService.getSalesTrends(query);
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'Get at-risk deals' })
  @ApiResponse({ status: 200, description: 'At-risk deals retrieved' })
  async getAtRiskDeals() {
    return this.dealService.getAtRiskDeals();
  }
}
