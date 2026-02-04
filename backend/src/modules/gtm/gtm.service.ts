import { Injectable } from '@nestjs/common';

@Injectable()
export class GTMService {
  async getGTMMetrics() {
    return {
      metrics: [
        {
          id: 'cac',
          name: 'Customer Acquisition Cost',
          value: 12500,
          unit: 'currency',
          trend: -8.3,
          category: 'acquisition',
          status: 'healthy',
        },
        {
          id: 'cac-payback',
          name: 'CAC Payback Period',
          value: 14,
          unit: 'months',
          trend: -12.5,
          category: 'acquisition',
          status: 'healthy',
        },
        {
          id: 'ltv',
          name: 'Customer Lifetime Value',
          value: 156000,
          unit: 'currency',
          trend: 15.2,
          category: 'retention',
          status: 'healthy',
        },
        {
          id: 'ltv-cac',
          name: 'LTV:CAC Ratio',
          value: 12.5,
          unit: 'ratio',
          trend: 18.4,
          category: 'efficiency',
          status: 'excellent',
        },
        {
          id: 'nrr',
          name: 'Net Revenue Retention',
          value: 118,
          unit: 'percent',
          trend: 5.2,
          category: 'retention',
          status: 'excellent',
        },
        {
          id: 'magic-number',
          name: 'Magic Number',
          value: 0.85,
          unit: 'ratio',
          trend: 12.1,
          category: 'efficiency',
          status: 'healthy',
        },
        {
          id: 'rule-of-40',
          name: 'Rule of 40',
          value: 52,
          unit: 'percent',
          trend: 8.7,
          category: 'growth',
          status: 'excellent',
        },
        {
          id: 'burn-multiple',
          name: 'Burn Multiple',
          value: 1.2,
          unit: 'ratio',
          trend: -15.3,
          category: 'efficiency',
          status: 'healthy',
        },
      ],
    };
  }

  async getUnitEconomics() {
    return {
      cac: 12500,
      ltv: 156000,
      ltvCacRatio: 12.5,
      paybackMonths: 14,
      grossMargin: 72,
      netRevenuRetention: 118,
      churnRate: 4.2,
      expansionRevenue: 22.5,
    };
  }

  async getLtvCacTrend(period?: string) {
    return {
      period: period || '12months',
      data: [
        { month: 'Feb 2024', ltv: 142000, cac: 14500, ratio: 9.8 },
        { month: 'Mar 2024', ltv: 145000, cac: 14200, ratio: 10.2 },
        { month: 'Apr 2024', ltv: 148000, cac: 13800, ratio: 10.7 },
        { month: 'May 2024', ltv: 150000, cac: 13500, ratio: 11.1 },
        { month: 'Jun 2024', ltv: 151000, cac: 13200, ratio: 11.4 },
        { month: 'Jul 2024', ltv: 152000, cac: 13000, ratio: 11.7 },
        { month: 'Aug 2024', ltv: 153000, cac: 12800, ratio: 12.0 },
        { month: 'Sep 2024', ltv: 154000, cac: 12700, ratio: 12.1 },
        { month: 'Oct 2024', ltv: 154500, cac: 12600, ratio: 12.3 },
        { month: 'Nov 2024', ltv: 155000, cac: 12550, ratio: 12.4 },
        { month: 'Dec 2024', ltv: 155500, cac: 12520, ratio: 12.4 },
        { month: 'Jan 2025', ltv: 156000, cac: 12500, ratio: 12.5 },
      ],
    };
  }

  async getCohortRetention() {
    return {
      cohorts: [
        {
          cohort: 'Q1 2024',
          customers: 45,
          month1: 100,
          month3: 96,
          month6: 92,
          month9: 89,
          month12: 86,
        },
        {
          cohort: 'Q2 2024',
          customers: 52,
          month1: 100,
          month3: 97,
          month6: 94,
          month9: 91,
          month12: null,
        },
        {
          cohort: 'Q3 2024',
          customers: 48,
          month1: 100,
          month3: 98,
          month6: 95,
          month9: null,
          month12: null,
        },
        {
          cohort: 'Q4 2024',
          customers: 61,
          month1: 100,
          month3: 97,
          month6: null,
          month9: null,
          month12: null,
        },
      ],
    };
  }

  async getIndustryBenchmarks() {
    return {
      benchmarks: [
        {
          metric: 'LTV:CAC Ratio',
          yourValue: 12.5,
          industryMedian: 3.0,
          topQuartile: 5.0,
          status: 'above',
        },
        {
          metric: 'CAC Payback',
          yourValue: 14,
          industryMedian: 18,
          topQuartile: 12,
          status: 'above',
        },
        {
          metric: 'Net Revenue Retention',
          yourValue: 118,
          industryMedian: 105,
          topQuartile: 120,
          status: 'above',
        },
        {
          metric: 'Magic Number',
          yourValue: 0.85,
          industryMedian: 0.75,
          topQuartile: 1.0,
          status: 'above',
        },
        {
          metric: 'Gross Margin',
          yourValue: 72,
          industryMedian: 70,
          topQuartile: 80,
          status: 'average',
        },
      ],
    };
  }

  async getHealthSummary() {
    return {
      overallScore: 87,
      strengths: [
        'Strong LTV:CAC ratio indicates efficient customer acquisition',
        'Net Revenue Retention above 100% shows healthy expansion',
        'CAC Payback under 18 months demonstrates capital efficiency',
      ],
      watchAreas: [
        'Gross margin slightly below top quartile benchmark',
        'Q4 cohort showing early signs of higher churn risk',
      ],
      recommendations: [
        'Focus on upsell motions to maintain NRR trajectory',
        'Investigate Q4 cohort onboarding experience',
        'Consider pricing optimization to improve gross margin',
      ],
    };
  }
}
