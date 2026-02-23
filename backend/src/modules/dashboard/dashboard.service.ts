import { Injectable } from '@nestjs/common';
import { GetDashboardDto } from './dto';
import { KpiService } from './services/kpi.service';
import { AnomalyService } from './services/anomaly.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly kpiService: KpiService,
    private readonly anomalyService: AnomalyService,
  ) {}

  async getExecutiveDashboard(query: GetDashboardDto) {
    const asOfDate = query.as_of_date ? new Date(query.as_of_date) : new Date();
    const comparisonPeriod = query.comparison_period || 'mom';

    const kpis = await this.kpiService.getExecutiveKpis({
      asOfDate,
      comparisonPeriod,
      region: query.region,
      lob: query.lob,
    });

    const anomalies = await this.anomalyService.getAnomalies({
      status: 'unresolved',
      limit: 5,
    });

    const aiInsights = await this.getAiInsights(query);
    const cashFlowForecast = await this.getCashFlowForecast(query);

    return {
      as_of_date: asOfDate.toISOString().split('T')[0],
      comparison_period: comparisonPeriod,
      kpis,
      anomalies: anomalies.data,
      ai_insights: aiInsights,
      cash_flow_forecast: cashFlowForecast,
    };
  }

  async getCashFlowForecast(query: GetDashboardDto) {
    const periods = [];
    const inflows = [];
    const outflows = [];
    const netCashFlow = [];
    const endingBalance = [];

    const baseDate = query.as_of_date ? new Date(query.as_of_date) : new Date();
    let currentBalance = 8500000;

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const monthName = forecastDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const baseInflow = 4200000 + (i * 150000);
      const baseOutflow = 3800000 + (i * 50000);
      const variance = (Math.random() - 0.5) * 200000;

      const monthInflow = Math.round(baseInflow + variance);
      const monthOutflow = Math.round(baseOutflow + variance * 0.5);
      const monthNet = monthInflow - monthOutflow;
      currentBalance += monthNet;

      periods.push(monthName);
      inflows.push(monthInflow);
      outflows.push(monthOutflow);
      netCashFlow.push(monthNet);
      endingBalance.push(currentBalance);
    }

    return {
      periods,
      inflows,
      outflows,
      net_cash_flow: netCashFlow,
      ending_balance: endingBalance,
    };
  }

  async getAllKpis(query: GetDashboardDto) {
    const asOfDate = query.as_of_date ? new Date(query.as_of_date) : new Date();
    const comparisonPeriod = query.comparison_period || 'mom';

    return this.kpiService.getExecutiveKpis({
      asOfDate,
      comparisonPeriod,
      region: query.region,
      lob: query.lob,
    });
  }

  async getRollingForecast(query: GetDashboardDto) {
    const periods = [];
    const actual = [];
    const forecast = [];
    const budget = [];

    const baseDate = query.as_of_date ? new Date(query.as_of_date) : new Date();

    // 6 months of actuals
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() - i);
      periods.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
      const base = 4000000 + (5 - i) * 200000;
      actual.push(Math.round(base + (Math.random() - 0.5) * 300000));
      forecast.push(null);
      budget.push(Math.round(base - 100000));
    }

    // 6 months of forecast
    for (let i = 1; i <= 6; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      periods.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
      actual.push(null);
      const base = 5200000 + i * 180000;
      forecast.push(Math.round(base + (Math.random() - 0.5) * 200000));
      budget.push(Math.round(base - 150000));
    }

    return { periods, actual, forecast, budget };
  }

  async getSaasMetrics(query: GetDashboardDto) {
    return {
      arr: { current: 48000000, previous: 39300000, growth: 0.22 },
      mrr: { current: 4000000, previous: 3275000, growth: 0.22 },
      net_revenue_retention: { current: 1.15, previous: 1.12, trend: 'up' },
      gross_revenue_retention: { current: 0.93, previous: 0.91, trend: 'up' },
      ltv: { current: 185000, previous: 162000, growth: 0.14 },
      cac: { current: 32000, previous: 35000, growth: -0.086 },
      ltv_cac_ratio: { current: 5.78, previous: 4.63, trend: 'up' },
      payback_months: { current: 9.6, previous: 11.2, trend: 'down' },
      magic_number: { current: 1.2, previous: 1.05, trend: 'up' },
      rule_of_40: { current: 44, growth_rate: 22, margin: 22, status: 'passing' },
      monthly_churn_rate: { current: 0.012, previous: 0.015, trend: 'down' },
      arpu: { current: 24000, previous: 21000, growth: 0.143 },
    };
  }

  async getRootCauseAnalysis(metric: string) {
    const analyses: Record<string, any> = {
      revenue: {
        metric: 'revenue',
        summary: 'Revenue growth driven primarily by enterprise expansion deals',
        primary_drivers: [
          { factor: 'Enterprise upsells', impact: 850000, direction: 'positive', contribution: 0.45 },
          { factor: 'New logo acquisition', impact: 620000, direction: 'positive', contribution: 0.33 },
          { factor: 'Churn in SMB segment', impact: -280000, direction: 'negative', contribution: -0.15 },
          { factor: 'Price increases', impact: 130000, direction: 'positive', contribution: 0.07 },
        ],
        trends: [
          { period: 'Q1 2025', value: 10200000 },
          { period: 'Q2 2025', value: 11000000 },
          { period: 'Q3 2025', value: 11800000 },
          { period: 'Q4 2025', value: 12500000 },
        ],
      },
      churn: {
        metric: 'churn',
        summary: 'Churn decreased due to improved onboarding and support',
        primary_drivers: [
          { factor: 'Product dissatisfaction', impact: -150000, direction: 'negative', contribution: 0.42 },
          { factor: 'Budget cuts at customers', impact: -100000, direction: 'negative', contribution: 0.28 },
          { factor: 'Competitive displacement', impact: -80000, direction: 'negative', contribution: 0.23 },
          { factor: 'Company closure', impact: -25000, direction: 'negative', contribution: 0.07 },
        ],
        trends: [
          { period: 'Q1 2025', value: 450000 },
          { period: 'Q2 2025', value: 380000 },
          { period: 'Q3 2025', value: 350000 },
          { period: 'Q4 2025', value: 280000 },
        ],
      },
    };

    return analyses[metric] || {
      metric,
      summary: `Root cause analysis for ${metric}`,
      primary_drivers: [
        { factor: 'Primary factor', impact: 500000, direction: 'positive', contribution: 0.6 },
        { factor: 'Secondary factor', impact: 200000, direction: 'positive', contribution: 0.25 },
        { factor: 'Negative factor', impact: -120000, direction: 'negative', contribution: -0.15 },
      ],
      trends: [],
    };
  }

  async getActionPlan(metric: string) {
    const plans: Record<string, any> = {
      revenue: {
        metric: 'revenue',
        target: 14000000,
        current: 12500000,
        gap: 1500000,
        actions: [
          { id: 'a1', title: 'Accelerate enterprise pipeline', owner: 'VP Sales', deadline: '2026-03-31', expected_impact: 600000, status: 'in_progress', priority: 'high' },
          { id: 'a2', title: 'Launch upsell campaign for existing accounts', owner: 'Customer Success', deadline: '2026-02-28', expected_impact: 400000, status: 'planned', priority: 'high' },
          { id: 'a3', title: 'Expand APAC channel partnerships', owner: 'Channel Lead', deadline: '2026-04-30', expected_impact: 300000, status: 'planned', priority: 'medium' },
          { id: 'a4', title: 'Reduce churn via proactive outreach', owner: 'CS Manager', deadline: '2026-03-15', expected_impact: 200000, status: 'in_progress', priority: 'medium' },
        ],
      },
      costs: {
        metric: 'costs',
        target: 3000000,
        current: 3200000,
        gap: -200000,
        actions: [
          { id: 'a1', title: 'Right-size cloud infrastructure', owner: 'CTO', deadline: '2026-03-31', expected_impact: 85000, status: 'in_progress', priority: 'high' },
          { id: 'a2', title: 'Renegotiate vendor contracts', owner: 'Procurement', deadline: '2026-04-15', expected_impact: 65000, status: 'planned', priority: 'medium' },
          { id: 'a3', title: 'Consolidate software licenses', owner: 'IT Manager', deadline: '2026-03-15', expected_impact: 50000, status: 'planned', priority: 'medium' },
        ],
      },
    };

    return plans[metric] || {
      metric,
      target: 0,
      current: 0,
      gap: 0,
      actions: [
        { id: 'a1', title: `Improve ${metric} performance`, owner: 'TBD', deadline: '2026-04-30', expected_impact: 0, status: 'planned', priority: 'medium' },
      ],
    };
  }

  async getCompetitors() {
    return {
      company: { name: 'Aether', arr: 48000000, growth_rate: 0.22, nrr: 1.15, gross_margin: 0.425, magic_number: 1.2 },
      competitors: [
        { name: 'Competitor A', arr: 85000000, growth_rate: 0.18, nrr: 1.1, gross_margin: 0.40, magic_number: 0.9 },
        { name: 'Competitor B', arr: 35000000, growth_rate: 0.30, nrr: 1.2, gross_margin: 0.38, magic_number: 1.4 },
        { name: 'Competitor C', arr: 62000000, growth_rate: 0.15, nrr: 1.08, gross_margin: 0.45, magic_number: 0.8 },
        { name: 'Industry Median', arr: null, growth_rate: 0.20, nrr: 1.12, gross_margin: 0.42, magic_number: 1.0 },
      ],
      metrics_compared: ['arr', 'growth_rate', 'nrr', 'gross_margin', 'magic_number'],
    };
  }

  async getAiInsights(query: GetDashboardDto) {
    return [
      {
        id: 'ins_001',
        type: 'recommendation',
        priority: 'high',
        title: 'Revenue Acceleration Opportunity',
        summary:
          'Pipeline analysis suggests 3 deals worth $2.1M could close early with targeted engagement',
        action_url: '/sales/pipeline?filter=accelerate',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ins_002',
        type: 'warning',
        priority: 'medium',
        title: 'Cloud Cost Optimization',
        summary:
          'Identified $85K in potential monthly savings through right-sizing unused instances',
        action_url: '/cost/optimization',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ins_003',
        type: 'insight',
        priority: 'low',
        title: 'EMEA Growth Trend',
        summary:
          'EMEA region showing 15% higher growth rate than forecast. Consider reallocating resources.',
        action_url: '/revenue/regions/emea',
        created_at: new Date().toISOString(),
      },
    ];
  }
}
