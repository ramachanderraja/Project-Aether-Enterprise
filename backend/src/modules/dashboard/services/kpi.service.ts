import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface GetKpisParams {
  asOfDate: Date;
  comparisonPeriod: string;
  region?: string;
  lob?: string;
}

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveKpis(params: GetKpisParams) {
    const { asOfDate, comparisonPeriod } = params;

    // Calculate period dates based on comparison type
    const previousPeriodStart = this.getPreviousPeriodDate(asOfDate, comparisonPeriod);

    // In production, these would be calculated from actual financial data
    // For now, return realistic sample data
    return {
      revenue: {
        current: 12500000,
        previous: 11800000,
        change_amount: 700000,
        change_percent: 5.93,
        trend: 'up',
        status: 'on_track',
        forecast: 14000000,
        budget: 13000000,
        variance_to_budget: -500000,
      },
      gross_margin: {
        current: 0.425,
        previous: 0.418,
        change_percent: 0.7,
        trend: 'up',
        status: 'on_track',
      },
      operating_expenses: {
        current: 3200000,
        previous: 3100000,
        change_percent: 3.22,
        trend: 'up',
        status: 'at_risk',
        budget: 3000000,
        variance_to_budget: 200000,
      },
      ebitda: {
        current: 2050000,
        previous: 1830000,
        change_percent: 12.02,
        trend: 'up',
        status: 'exceeding',
      },
      cash_position: {
        current: 8500000,
        runway_months: 18,
        burn_rate: 470000,
        trend: 'stable',
      },
      arr: {
        current: 48000000,
        new_arr: 1200000,
        churned_arr: 350000,
        net_new_arr: 850000,
        growth_rate: 0.22,
      },
    };
  }

  async getKpiDetails(kpiId: string, query: any) {
    // Return detailed breakdown for specific KPI
    const kpiDefinitions: Record<string, any> = {
      revenue: {
        kpi_id: 'revenue',
        name: 'Total Revenue',
        description: 'Sum of all recognized revenue for the period',
        current_value: 12500000,
        unit: 'currency',
        currency: 'USD',
        breakdown: {
          by_region: [
            { region: 'North America', value: 7500000, percent: 60 },
            { region: 'EMEA', value: 3125000, percent: 25 },
            { region: 'APAC', value: 1875000, percent: 15 },
          ],
          by_lob: [
            { lob: 'Enterprise', value: 8750000, percent: 70 },
            { lob: 'Mid-Market', value: 2500000, percent: 20 },
            { lob: 'SMB', value: 1250000, percent: 10 },
          ],
          by_product: [
            { product: 'Core Platform', value: 9375000, percent: 75 },
            { product: 'Analytics Add-on', value: 1875000, percent: 15 },
            { product: 'Services', value: 1250000, percent: 10 },
          ],
        },
        trend: {
          periods: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
          values: [10800000, 11200000, 11800000, 12500000],
          growth_rates: [0.037, 0.053, 0.059],
        },
        drivers: [
          { driver: 'New customer acquisition', contribution: 850000, impact: 'positive' },
          { driver: 'Expansion revenue', contribution: 450000, impact: 'positive' },
          { driver: 'Churn', contribution: -200000, impact: 'negative' },
        ],
      },
      gross_margin: {
        kpi_id: 'gross_margin',
        name: 'Gross Margin',
        description: 'Gross profit as percentage of revenue',
        current_value: 0.425,
        unit: 'percentage',
        breakdown: {
          by_product: [
            { product: 'Core Platform', value: 0.52, contribution: 0.39 },
            { product: 'Analytics Add-on', value: 0.45, contribution: 0.0675 },
            { product: 'Services', value: 0.25, contribution: 0.025 },
          ],
        },
        trend: {
          periods: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026'],
          values: [0.41, 0.415, 0.418, 0.425],
        },
      },
      operating_expenses: {
        kpi_id: 'operating_expenses',
        name: 'Operating Expenses',
        description: 'Total operating expenses excluding COGS',
        current_value: 3200000,
        unit: 'currency',
        currency: 'USD',
        breakdown: {
          by_category: [
            { category: 'Personnel', value: 1750000, percent: 54.7, budget: 1700000 },
            { category: 'Technology', value: 580000, percent: 18.1, budget: 500000 },
            { category: 'Marketing', value: 420000, percent: 13.1, budget: 400000 },
            { category: 'Facilities', value: 250000, percent: 7.8, budget: 250000 },
            { category: 'Other', value: 200000, percent: 6.3, budget: 150000 },
          ],
        },
      },
    };

    return kpiDefinitions[kpiId] || { error: 'KPI not found', kpi_id: kpiId };
  }

  private getPreviousPeriodDate(date: Date, period: string): Date {
    const prevDate = new Date(date);
    switch (period) {
      case 'mom':
        prevDate.setMonth(prevDate.getMonth() - 1);
        break;
      case 'qoq':
        prevDate.setMonth(prevDate.getMonth() - 3);
        break;
      case 'yoy':
        prevDate.setFullYear(prevDate.getFullYear() - 1);
        break;
    }
    return prevDate;
  }
}
