import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReportDto,
  ScheduleReportDto,
  ReportTemplateDto,
  ExportDataDto,
  ReportType,
  ExportFormat,
  ReportFrequency,
} from './dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Report generation
  async generateReport(organizationId: string, dto: CreateReportDto) {
    this.logger.log(`Generating ${dto.type} report for org ${organizationId}`);

    // Mock report generation based on type
    const reportData = await this.getReportData(organizationId, dto);

    const report = {
      id: `rpt_${Date.now()}`,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      format: dto.format,
      organizationId,
      status: 'COMPLETED',
      filters: dto.filters,
      data: reportData,
      fileUrl: `/reports/${organizationId}/rpt_${Date.now()}.${dto.format.toLowerCase()}`,
      fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    return report;
  }

  private async getReportData(organizationId: string, dto: CreateReportDto) {
    switch (dto.type) {
      case ReportType.FINANCIAL_SUMMARY:
        return this.getFinancialSummaryData(organizationId, dto.filters);
      case ReportType.REVENUE_ANALYSIS:
        return this.getRevenueAnalysisData(organizationId, dto.filters);
      case ReportType.COST_BREAKDOWN:
        return this.getCostBreakdownData(organizationId, dto.filters);
      case ReportType.SALES_PIPELINE:
        return this.getSalesPipelineData(organizationId, dto.filters);
      case ReportType.SCENARIO_COMPARISON:
        return this.getScenarioComparisonData(organizationId, dto.filters);
      case ReportType.AUDIT_LOG:
        return this.getAuditLogData(organizationId, dto.filters);
      case ReportType.FORECAST:
        return this.getForecastData(organizationId, dto.filters);
      default:
        return this.getCustomReportData(organizationId, dto.filters);
    }
  }

  private getFinancialSummaryData(organizationId: string, filters?: any) {
    return {
      summary: {
        totalRevenue: 24500000,
        totalCosts: 18200000,
        netIncome: 6300000,
        grossMargin: 0.42,
        operatingMargin: 0.26,
        ebitda: 7100000,
      },
      revenueByMonth: [
        { month: 'Jan', revenue: 1850000 },
        { month: 'Feb', revenue: 1920000 },
        { month: 'Mar', revenue: 2100000 },
        { month: 'Apr', revenue: 2050000 },
        { month: 'May', revenue: 2180000 },
        { month: 'Jun', revenue: 2250000 },
      ],
      costsByCategory: [
        { category: 'Personnel', amount: 9200000, percentage: 50.5 },
        { category: 'Infrastructure', amount: 3640000, percentage: 20.0 },
        { category: 'Marketing', amount: 2730000, percentage: 15.0 },
        { category: 'Operations', amount: 1820000, percentage: 10.0 },
        { category: 'Other', amount: 810000, percentage: 4.5 },
      ],
      kpis: {
        revenueGrowth: 0.18,
        costReduction: 0.05,
        profitMargin: 0.26,
        cashFlow: 4200000,
      },
    };
  }

  private getRevenueAnalysisData(organizationId: string, filters?: any) {
    return {
      totalRevenue: 24500000,
      arrMovement: {
        startingARR: 21000000,
        newBusiness: 4200000,
        expansion: 1800000,
        contraction: -850000,
        churn: -1650000,
        endingARR: 24500000,
      },
      revenueByProduct: [
        { product: 'Enterprise Suite', revenue: 12250000, growth: 0.22 },
        { product: 'Professional', revenue: 7350000, growth: 0.15 },
        { product: 'Starter', revenue: 4900000, growth: 0.12 },
      ],
      revenueByRegion: [
        { region: 'North America', revenue: 14700000, percentage: 60 },
        { region: 'Europe', revenue: 6125000, percentage: 25 },
        { region: 'APAC', revenue: 3675000, percentage: 15 },
      ],
      customerMetrics: {
        totalCustomers: 2450,
        newCustomers: 320,
        churnedCustomers: 85,
        avgRevenuePerCustomer: 10000,
        nrr: 1.12,
        grr: 0.93,
      },
    };
  }

  private getCostBreakdownData(organizationId: string, filters?: any) {
    return {
      totalCosts: 18200000,
      costsByDepartment: [
        { department: 'Engineering', amount: 5460000, budget: 5500000, variance: -0.7 },
        { department: 'Sales', amount: 4550000, budget: 4400000, variance: 3.4 },
        { department: 'Marketing', amount: 2730000, budget: 2800000, variance: -2.5 },
        { department: 'Operations', amount: 2912000, budget: 3000000, variance: -2.9 },
        { department: 'G&A', amount: 2548000, budget: 2500000, variance: 1.9 },
      ],
      costTrend: [
        { month: 'Jan', actual: 2900000, budget: 3000000 },
        { month: 'Feb', actual: 2950000, budget: 3000000 },
        { month: 'Mar', actual: 3100000, budget: 3050000 },
        { month: 'Apr', actual: 3050000, budget: 3050000 },
        { month: 'May', actual: 3000000, budget: 3100000 },
        { month: 'Jun', actual: 3200000, budget: 3100000 },
      ],
      optimizationOpportunities: [
        { area: 'Cloud Infrastructure', potentialSavings: 450000, effort: 'Medium' },
        { area: 'Software Licenses', potentialSavings: 280000, effort: 'Low' },
        { area: 'Travel & Expenses', potentialSavings: 150000, effort: 'Low' },
      ],
    };
  }

  private getSalesPipelineData(organizationId: string, filters?: any) {
    return {
      pipelineValue: 45000000,
      pipelineByStage: [
        { stage: 'Lead', count: 450, value: 9000000, conversion: 0.35 },
        { stage: 'Qualified', count: 180, value: 12600000, conversion: 0.55 },
        { stage: 'Proposal', count: 95, value: 9500000, conversion: 0.65 },
        { stage: 'Negotiation', count: 55, value: 8250000, conversion: 0.78 },
        { stage: 'Closed Won', count: 42, value: 5650000, conversion: 1.0 },
      ],
      winRate: 0.28,
      avgDealSize: 134500,
      avgSalesCycle: 68,
      forecastedRevenue: 12600000,
      topDeals: [
        { company: 'Acme Corp', value: 2500000, stage: 'Negotiation', probability: 0.85 },
        { company: 'TechGiant Inc', value: 1800000, stage: 'Proposal', probability: 0.65 },
        { company: 'Global Services', value: 1500000, stage: 'Qualified', probability: 0.45 },
      ],
    };
  }

  private getScenarioComparisonData(organizationId: string, filters?: any) {
    return {
      scenarios: [
        {
          name: 'Base Case',
          revenue: 24500000,
          costs: 18200000,
          netIncome: 6300000,
          probability: 0.5,
        },
        {
          name: 'Optimistic',
          revenue: 28000000,
          costs: 19500000,
          netIncome: 8500000,
          probability: 0.25,
        },
        {
          name: 'Conservative',
          revenue: 21000000,
          costs: 17500000,
          netIncome: 3500000,
          probability: 0.25,
        },
      ],
      varianceAnalysis: {
        revenueRange: { min: 21000000, max: 28000000, expected: 24500000 },
        costRange: { min: 17500000, max: 19500000, expected: 18200000 },
        netIncomeRange: { min: 3500000, max: 8500000, expected: 6300000 },
      },
      sensitivityFactors: [
        { factor: 'Customer Growth Rate', impact: 2500000, sensitivity: 'High' },
        { factor: 'Pricing Changes', impact: 1800000, sensitivity: 'High' },
        { factor: 'Churn Rate', impact: 1200000, sensitivity: 'Medium' },
        { factor: 'Cost Inflation', impact: 800000, sensitivity: 'Medium' },
      ],
    };
  }

  private getAuditLogData(organizationId: string, filters?: any) {
    return {
      totalEvents: 15420,
      eventsByType: [
        { type: 'DATA_ACCESS', count: 8500 },
        { type: 'DATA_MODIFICATION', count: 3200 },
        { type: 'USER_LOGIN', count: 2100 },
        { type: 'APPROVAL_ACTION', count: 850 },
        { type: 'CONFIGURATION_CHANGE', count: 420 },
        { type: 'REPORT_GENERATION', count: 350 },
      ],
      recentActivity: [
        { timestamp: new Date(), user: 'john.smith@company.com', action: 'Updated forecast', resource: 'Q2 Forecast' },
        { timestamp: new Date(), user: 'jane.doe@company.com', action: 'Approved scenario', resource: 'Expansion Plan' },
        { timestamp: new Date(), user: 'bob.wilson@company.com', action: 'Generated report', resource: 'Monthly Summary' },
      ],
      complianceStatus: {
        soxCompliant: true,
        gdprCompliant: true,
        lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextAudit: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    };
  }

  private getForecastData(organizationId: string, filters?: any) {
    return {
      forecastPeriod: '2024',
      quarterlyForecast: [
        { quarter: 'Q1', revenue: 6200000, costs: 4600000, netIncome: 1600000, confidence: 0.95 },
        { quarter: 'Q2', revenue: 6500000, costs: 4700000, netIncome: 1800000, confidence: 0.88 },
        { quarter: 'Q3', revenue: 6800000, costs: 4800000, netIncome: 2000000, confidence: 0.75 },
        { quarter: 'Q4', revenue: 7200000, costs: 5000000, netIncome: 2200000, confidence: 0.62 },
      ],
      assumptions: [
        { assumption: 'Customer Growth', value: '15% YoY' },
        { assumption: 'Churn Rate', value: '7% annual' },
        { assumption: 'Price Increase', value: '3% annual' },
        { assumption: 'Headcount Growth', value: '12% YoY' },
      ],
      risks: [
        { risk: 'Market downturn', probability: 0.15, impact: 'High' },
        { risk: 'Key customer churn', probability: 0.10, impact: 'Medium' },
        { risk: 'Competitive pressure', probability: 0.25, impact: 'Medium' },
      ],
    };
  }

  private getCustomReportData(organizationId: string, filters?: any) {
    return {
      customData: 'Custom report data would be generated based on user selections',
      generatedAt: new Date(),
    };
  }

  // List reports
  async getReports(organizationId: string, type?: ReportType) {
    return {
      reports: [
        {
          id: 'rpt_001',
          name: 'Q4 Financial Summary',
          type: ReportType.FINANCIAL_SUMMARY,
          format: ExportFormat.PDF,
          status: 'COMPLETED',
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          generatedBy: 'john.smith@company.com',
          fileSize: 2450000,
        },
        {
          id: 'rpt_002',
          name: 'Monthly Revenue Analysis',
          type: ReportType.REVENUE_ANALYSIS,
          format: ExportFormat.EXCEL,
          status: 'COMPLETED',
          generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          generatedBy: 'jane.doe@company.com',
          fileSize: 1850000,
        },
        {
          id: 'rpt_003',
          name: 'Cost Optimization Report',
          type: ReportType.COST_BREAKDOWN,
          format: ExportFormat.POWERPOINT,
          status: 'COMPLETED',
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          generatedBy: 'bob.wilson@company.com',
          fileSize: 5200000,
        },
      ],
      total: 3,
    };
  }

  async getReport(organizationId: string, reportId: string) {
    const reports = await this.getReports(organizationId);
    const report = reports.reports.find((r) => r.id === reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async deleteReport(organizationId: string, reportId: string) {
    this.logger.log(`Deleting report ${reportId}`);
    return { success: true, message: 'Report deleted successfully' };
  }

  // Scheduled reports
  async scheduleReport(organizationId: string, dto: ScheduleReportDto) {
    this.logger.log(`Scheduling report ${dto.reportId} with frequency ${dto.frequency}`);

    return {
      id: `sched_${Date.now()}`,
      reportId: dto.reportId,
      frequency: dto.frequency,
      cronExpression: dto.cronExpression || this.getCronExpression(dto.frequency),
      recipients: dto.recipients,
      isActive: dto.isActive ?? true,
      nextRun: this.getNextRunDate(dto.frequency),
      createdAt: new Date(),
    };
  }

  private getCronExpression(frequency: ReportFrequency): string {
    switch (frequency) {
      case ReportFrequency.DAILY:
        return '0 8 * * *'; // 8 AM daily
      case ReportFrequency.WEEKLY:
        return '0 8 * * 1'; // 8 AM Monday
      case ReportFrequency.MONTHLY:
        return '0 8 1 * *'; // 8 AM 1st of month
      case ReportFrequency.QUARTERLY:
        return '0 8 1 */3 *'; // 8 AM 1st of quarter
      default:
        return '';
    }
  }

  private getNextRunDate(frequency: ReportFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case ReportFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ReportFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case ReportFrequency.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      case ReportFrequency.QUARTERLY:
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 1);
      default:
        return now;
    }
  }

  async getScheduledReports(organizationId: string) {
    return {
      schedules: [
        {
          id: 'sched_001',
          reportName: 'Weekly Financial Summary',
          reportType: ReportType.FINANCIAL_SUMMARY,
          frequency: ReportFrequency.WEEKLY,
          recipients: ['cfo@company.com', 'finance-team@company.com'],
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          id: 'sched_002',
          reportName: 'Monthly Revenue Report',
          reportType: ReportType.REVENUE_ANALYSIS,
          frequency: ReportFrequency.MONTHLY,
          recipients: ['ceo@company.com', 'sales-team@company.com'],
          nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      ],
      total: 2,
    };
  }

  async cancelScheduledReport(organizationId: string, scheduleId: string) {
    this.logger.log(`Canceling scheduled report ${scheduleId}`);
    return { success: true, message: 'Scheduled report cancelled' };
  }

  // Report templates
  async createTemplate(organizationId: string, dto: ReportTemplateDto) {
    return {
      id: `tmpl_${Date.now()}`,
      ...dto,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getTemplates(organizationId: string) {
    return {
      templates: [
        {
          id: 'tmpl_001',
          name: 'Executive Summary',
          description: 'High-level financial summary for executive team',
          type: ReportType.FINANCIAL_SUMMARY,
          sections: ['KPIs', 'Revenue', 'Costs', 'Forecast'],
          includeCharts: true,
          includeDataTables: false,
        },
        {
          id: 'tmpl_002',
          name: 'Detailed Revenue Analysis',
          description: 'Comprehensive revenue breakdown by product and region',
          type: ReportType.REVENUE_ANALYSIS,
          sections: ['ARR Movement', 'By Product', 'By Region', 'Customer Metrics'],
          includeCharts: true,
          includeDataTables: true,
        },
        {
          id: 'tmpl_003',
          name: 'Board Presentation',
          description: 'Quarterly board presentation template',
          type: ReportType.FINANCIAL_SUMMARY,
          sections: ['Financial Highlights', 'Strategic Initiatives', 'Outlook'],
          includeCharts: true,
          includeDataTables: false,
        },
      ],
      total: 3,
    };
  }

  async deleteTemplate(organizationId: string, templateId: string) {
    this.logger.log(`Deleting template ${templateId}`);
    return { success: true, message: 'Template deleted successfully' };
  }

  // Data export
  async exportData(organizationId: string, dto: ExportDataDto) {
    this.logger.log(`Exporting ${dto.dataType} data as ${dto.format}`);

    return {
      id: `exp_${Date.now()}`,
      dataType: dto.dataType,
      format: dto.format,
      status: 'COMPLETED',
      fileUrl: `/exports/${organizationId}/exp_${Date.now()}.${dto.format.toLowerCase()}`,
      fileSize: Math.floor(Math.random() * 2000000) + 50000,
      rowCount: Math.floor(Math.random() * 10000) + 100,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async getExportHistory(organizationId: string) {
    return {
      exports: [
        {
          id: 'exp_001',
          dataType: 'transactions',
          format: ExportFormat.CSV,
          rowCount: 15420,
          generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          generatedBy: 'analyst@company.com',
        },
        {
          id: 'exp_002',
          dataType: 'customers',
          format: ExportFormat.EXCEL,
          rowCount: 2450,
          generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          generatedBy: 'sales@company.com',
        },
      ],
      total: 2,
    };
  }
}
