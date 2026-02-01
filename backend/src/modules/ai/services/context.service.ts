import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildFinancialContext(context?: any) {
    // Build a comprehensive financial context for the AI
    // In production, this would query real data based on the context

    const baseContext = {
      current_period: 'January 2026',
      currency: 'USD',
      company: 'Acme Corporation',
    };

    const kpis = {
      revenue: {
        current: 12500000,
        prior_month: 11800000,
        budget: 13000000,
        forecast: 14000000,
        change_mom: 5.93,
        variance_to_budget: -500000,
      },
      gross_margin: {
        current: 0.425,
        prior_month: 0.418,
        target: 0.45,
      },
      operating_expenses: {
        current: 3200000,
        budget: 3000000,
        variance: 200000,
        variance_percent: 6.67,
      },
      ebitda: {
        current: 2050000,
        prior_month: 1830000,
        change_percent: 12.02,
      },
      cash: {
        current: 8500000,
        burn_rate: 470000,
        runway_months: 18,
      },
      arr: {
        current: 48000000,
        growth_rate: 0.22,
        net_new: 850000,
        churn: 350000,
      },
    };

    const anomalies = [
      {
        type: 'cost_spike',
        metric: 'Cloud Infrastructure',
        variance: 47,
        impact: 79000,
        status: 'unresolved',
      },
      {
        type: 'revenue_miss',
        metric: 'EMEA Revenue',
        variance: -8,
        impact: -250000,
        status: 'investigating',
      },
    ];

    const pipeline = {
      total_value: 45000000,
      weighted_value: 22500000,
      deals_count: 156,
      average_deal_size: 288462,
      forecast_gap: 800000,
    };

    const recentInsights = [
      '3 enterprise deals worth $2.1M showing high close probability',
      'Cloud costs trending 15% above forecast',
      'EMEA region growing 10% faster than budget',
    ];

    // Merge with any provided context
    return {
      ...baseContext,
      kpis,
      anomalies,
      pipeline,
      recent_insights: recentInsights,
      user_context: context || {},
    };
  }

  async getMetricsContext(metricType: string) {
    // Return detailed context for specific metric types
    const metricsContext: Record<string, any> = {
      revenue: {
        total: 12500000,
        by_region: {
          'North America': 7500000,
          'EMEA': 3125000,
          'APAC': 1875000,
        },
        by_segment: {
          'Enterprise': 8750000,
          'Mid-Market': 2500000,
          'SMB': 1250000,
        },
        by_product: {
          'Core Platform': 9375000,
          'Analytics': 1875000,
          'Services': 1250000,
        },
        trend_12m: [9.2, 9.5, 9.8, 10.1, 10.4, 10.6, 10.8, 11.0, 11.2, 11.5, 11.8, 12.5],
      },
      costs: {
        total: 8200000,
        by_category: {
          'Personnel': 4500000,
          'Technology': 1800000,
          'Facilities': 650000,
          'Professional Services': 750000,
          'Marketing': 500000,
        },
        top_vendors: [
          { name: 'AWS', spend: 1100000, variance: 47 },
          { name: 'Salesforce', spend: 850000, variance: 6.25 },
          { name: 'Workday', spend: 450000, variance: 0 },
        ],
      },
      pipeline: {
        by_stage: {
          'Prospecting': { value: 8500000, count: 45 },
          'Qualification': { value: 12000000, count: 38 },
          'Proposal': { value: 15000000, count: 42 },
          'Negotiation': { value: 9500000, count: 31 },
        },
        top_deals: [
          { name: 'Acme Corp', value: 450000, stage: 'Negotiation', probability: 0.75 },
          { name: 'TechStart Inc', value: 380000, stage: 'Proposal', probability: 0.50 },
          { name: 'Global Industries', value: 520000, stage: 'Qualification', probability: 0.25 },
        ],
      },
    };

    return metricsContext[metricType] || metricsContext;
  }
}
