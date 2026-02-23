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
import { Public } from '../auth/decorators/public.decorator';
import { SalesService } from './sales.service';
import { DealService } from './services/deal.service';
import { ForecastService } from './services/forecast.service';
import { SalesComputeService } from './services/sales-compute.service';
import { GetPipelineDto, GetDealsDto, UpdateDealDto, CreateDealDto } from './dto';
import { SalesFilterDto, PipelineMovementFilterDto, DealsFilterDto, QuotaFilterDto } from './dto/filters.dto';

@ApiTags('Sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly dealService: DealService,
    private readonly forecastService: ForecastService,
    private readonly salesComputeService: SalesComputeService,
  ) {}

  // ── Legacy endpoint (kept for backward compat) ──

  @Public()
  @Get('data')
  @ApiOperation({ summary: '[Deprecated] Get all sales CSV data for the Sales page' })
  @ApiResponse({ status: 200, description: 'Sales data retrieved from CSV files' })
  getSalesData() {
    return this.salesService.getSalesData();
  }

  // ── New computed endpoints ──

  @Public()
  @Get('overview/metrics')
  @ApiOperation({ summary: 'Get overview KPI metrics' })
  @ApiResponse({ status: 200, description: 'Overview metrics computed' })
  getOverviewMetrics(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getOverviewMetrics(filters);
  }

  @Public()
  @Get('overview/funnel')
  @ApiOperation({ summary: 'Get pipeline funnel data' })
  @ApiResponse({ status: 200, description: 'Funnel data computed' })
  getOverviewFunnel(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getOverviewFunnel(filters);
  }

  @Public()
  @Get('overview/key-deals')
  @ApiOperation({ summary: 'Get top active deals' })
  @ApiResponse({ status: 200, description: 'Key deals computed' })
  getOverviewKeyDeals(@Query() filters: DealsFilterDto) {
    return this.salesComputeService.getOverviewKeyDeals(filters);
  }

  @Public()
  @Get('overview/closed-deals')
  @ApiOperation({ summary: 'Get closed ACV deals' })
  @ApiResponse({ status: 200, description: 'Closed deals computed' })
  getOverviewClosedDeals(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getOverviewClosedDeals(filters);
  }

  @Public()
  @Get('forecast/quarterly')
  @ApiOperation({ summary: 'Get quarterly forecast data' })
  @ApiResponse({ status: 200, description: 'Quarterly forecast computed' })
  getForecastQuarterly(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getForecastQuarterly(filters);
  }

  @Public()
  @Get('forecast/regional')
  @ApiOperation({ summary: 'Get regional forecast data' })
  @ApiResponse({ status: 200, description: 'Regional forecast computed' })
  getForecastRegional(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getForecastRegional(filters);
  }

  @Public()
  @Get('forecast/trend')
  @ApiOperation({ summary: 'Get cumulative monthly forecast trend' })
  @ApiResponse({ status: 200, description: 'Forecast trend computed' })
  getForecastTrend(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getForecastTrend(filters);
  }

  @Public()
  @Get('forecast/by-subcategory')
  @ApiOperation({ summary: 'Get forecast breakdown by sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category forecast computed' })
  getForecastBySubcategory(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getForecastBySubcategory(filters);
  }

  @Public()
  @Get('pipeline/movement')
  @ApiOperation({ summary: 'Get pipeline movement MoM comparison and waterfall' })
  @ApiResponse({ status: 200, description: 'Pipeline movement computed' })
  getPipelineMovement(@Query() filters: PipelineMovementFilterDto) {
    return this.salesComputeService.getPipelineMovement(filters);
  }

  @Public()
  @Get('pipeline/by-subcategory')
  @ApiOperation({ summary: 'Get pipeline breakdown by sub-category' })
  @ApiResponse({ status: 200, description: 'Pipeline by sub-category computed' })
  getPipelineBySubcategory(@Query() filters: SalesFilterDto) {
    return this.salesComputeService.getPipelineBySubcategory(filters);
  }

  @Public()
  @Get('quota/salespeople')
  @ApiOperation({ summary: 'Get salesperson hierarchy with quota attainment' })
  @ApiResponse({ status: 200, description: 'Salespeople quota data computed' })
  getQuotaSalespeople(@Query() filters: QuotaFilterDto) {
    return this.salesComputeService.getQuotaSalespeople(filters);
  }

  // ── Existing endpoints (kept) ──

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
