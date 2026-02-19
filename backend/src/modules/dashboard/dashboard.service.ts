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
