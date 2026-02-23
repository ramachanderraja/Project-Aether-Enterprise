import {
  Controller,
  Get,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { AnomalyService } from './services/anomaly.service';
import { KpiService } from './services/kpi.service';
import {
  GetDashboardDto,
  GetAnomaliesDto,
  UpdateAnomalyDto,
  GetKpiDetailsDto,
} from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly anomalyService: AnomalyService,
    private readonly kpiService: KpiService,
  ) {}

  @Get('executive')
  @ApiOperation({ summary: 'Get executive dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  @ApiQuery({ name: 'as_of_date', required: false })
  @ApiQuery({ name: 'comparison_period', required: false, enum: ['mom', 'qoq', 'yoy'] })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'lob', required: false })
  async getExecutiveDashboard(@Query() query: GetDashboardDto) {
    return this.dashboardService.getExecutiveDashboard(query);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs summary' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved' })
  async getAllKpis(@Query() query: GetDashboardDto) {
    return this.dashboardService.getAllKpis(query);
  }

  @Get('kpis/:kpiId')
  @ApiOperation({ summary: 'Get detailed KPI breakdown' })
  @ApiResponse({ status: 200, description: 'KPI details retrieved' })
  async getKpiDetails(
    @Param('kpiId') kpiId: string,
    @Query() query: GetKpiDetailsDto,
  ) {
    return this.kpiService.getKpiDetails(kpiId, query);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get list of detected anomalies' })
  @ApiResponse({ status: 200, description: 'Anomalies retrieved' })
  async getAnomalies(@Query() query: GetAnomaliesDto) {
    return this.anomalyService.getAnomalies(query);
  }

  @Get('anomalies/:anomalyId')
  @ApiOperation({ summary: 'Get anomaly details' })
  @ApiResponse({ status: 200, description: 'Anomaly details retrieved' })
  async getAnomalyDetails(@Param('anomalyId') anomalyId: string) {
    return this.anomalyService.getAnomalyById(anomalyId);
  }

  @Patch('anomalies/:anomalyId')
  @ApiOperation({ summary: 'Update anomaly status or assignment' })
  @ApiResponse({ status: 200, description: 'Anomaly updated' })
  async updateAnomaly(
    @Param('anomalyId') anomalyId: string,
    @Body() updateDto: UpdateAnomalyDto,
  ) {
    return this.anomalyService.updateAnomaly(anomalyId, updateDto);
  }

  @Get('cash-flow-forecast')
  @ApiOperation({ summary: 'Get cash flow forecast' })
  @ApiResponse({ status: 200, description: 'Cash flow forecast retrieved' })
  async getCashFlowForecast(@Query() query: GetDashboardDto) {
    return this.dashboardService.getCashFlowForecast(query);
  }

  @Get('rolling-forecast')
  @ApiOperation({ summary: 'Get rolling forecast' })
  @ApiResponse({ status: 200, description: 'Rolling forecast retrieved' })
  async getRollingForecast(@Query() query: GetDashboardDto) {
    return this.dashboardService.getRollingForecast(query);
  }

  @Get('saas-metrics')
  @ApiOperation({ summary: 'Get SaaS metrics' })
  @ApiResponse({ status: 200, description: 'SaaS metrics retrieved' })
  async getSaasMetrics(@Query() query: GetDashboardDto) {
    return this.dashboardService.getSaasMetrics(query);
  }

  @Get('rca/:metric')
  @ApiOperation({ summary: 'Get root cause analysis for a metric' })
  @ApiResponse({ status: 200, description: 'RCA retrieved' })
  async getRCA(@Param('metric') metric: string) {
    return this.dashboardService.getRootCauseAnalysis(metric);
  }

  @Get('action-plan/:metric')
  @ApiOperation({ summary: 'Get action plan for a metric' })
  @ApiResponse({ status: 200, description: 'Action plan retrieved' })
  async getActionPlan(@Param('metric') metric: string) {
    return this.dashboardService.getActionPlan(metric);
  }

  @Get('competitors')
  @ApiOperation({ summary: 'Get competitor comparison data' })
  @ApiResponse({ status: 200, description: 'Competitors data retrieved' })
  async getCompetitors() {
    return this.dashboardService.getCompetitors();
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-generated insights' })
  @ApiResponse({ status: 200, description: 'Insights retrieved' })
  async getInsights(@Query() query: GetDashboardDto) {
    return this.dashboardService.getAiInsights(query);
  }
}
