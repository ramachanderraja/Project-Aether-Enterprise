import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RevenueService } from './revenue.service';
import { RevenueComputeService } from './services/revenue-compute.service';
import {
  RevenueFilterDto,
  MovementFilterDto,
  CustomerMovementFilterDto,
  CustomerListFilterDto,
  ProductsFilterDto,
} from './dto/filters.dto';

@ApiTags('Revenue')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly revenueComputeService: RevenueComputeService,
  ) {}

  // ── Legacy endpoint (kept for backward compat) ──

  @Public()
  @Get('data')
  @ApiOperation({ summary: '[Deprecated] Get all revenue CSV data for the Revenue page' })
  getRevenueData() {
    return this.revenueService.getRevenueData();
  }

  // ── New computed endpoints ──

  @Public()
  @Get('overview/metrics')
  @ApiOperation({ summary: 'Get revenue overview KPI metrics' })
  getOverviewMetrics(@Query() filters: RevenueFilterDto) {
    return this.revenueComputeService.getOverviewMetrics(filters);
  }

  @Public()
  @Get('overview/arr-trend')
  @ApiOperation({ summary: 'Get ARR trend chart data (Jan 2024 - Dec 2026)' })
  getOverviewArrTrend(@Query() filters: RevenueFilterDto) {
    return this.revenueComputeService.getOverviewArrTrend(filters);
  }

  @Public()
  @Get('overview/arr-by-dimension')
  @ApiOperation({ summary: 'Get ARR breakdown by region, vertical, and category' })
  getOverviewArrByDimension(@Query() filters: RevenueFilterDto) {
    return this.revenueComputeService.getOverviewArrByDimension(filters);
  }

  @Public()
  @Get('movement/summary')
  @ApiOperation({ summary: 'Get ARR movement waterfall bridge' })
  getMovementSummary(@Query() filters: MovementFilterDto) {
    return this.revenueComputeService.getMovementSummary(filters);
  }

  @Public()
  @Get('movement/customers')
  @ApiOperation({ summary: 'Get customer-level movement detail' })
  getMovementCustomers(@Query() filters: CustomerMovementFilterDto) {
    return this.revenueComputeService.getMovementCustomers(filters);
  }

  @Public()
  @Get('movement/trend')
  @ApiOperation({ summary: 'Get monthly movement trend chart data' })
  getMovementTrend(@Query() filters: RevenueFilterDto) {
    return this.revenueComputeService.getMovementTrend(filters);
  }

  @Public()
  @Get('customers/list')
  @ApiOperation({ summary: 'Get expandable customer list with SOW details' })
  getCustomersList(@Query() filters: CustomerListFilterDto) {
    return this.revenueComputeService.getCustomersList(filters);
  }

  @Public()
  @Get('customers/renewal-risk')
  @ApiOperation({ summary: 'Get 2026 renewal risk distribution and calendar' })
  getCustomerRenewalRisk(@Query() filters: RevenueFilterDto) {
    return this.revenueComputeService.getCustomerRenewalRisk(filters);
  }

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'Get product revenue breakdown' })
  getProducts(@Query() filters: ProductsFilterDto) {
    return this.revenueComputeService.getProducts(filters);
  }

  // ── Existing endpoints (kept) ──

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
