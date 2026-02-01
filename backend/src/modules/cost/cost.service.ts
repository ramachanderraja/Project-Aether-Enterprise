import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetCostDto } from './dto';

@Injectable()
export class CostService {
  constructor(private readonly prisma: PrismaService) {}

  async getCostOverview(query: GetCostDto) {
    return {
      period: { type: 'mtd', start_date: '2026-01-01', end_date: '2026-01-31' },
      summary: {
        total_costs: 8200000,
        budget: 7800000,
        variance: 400000,
        variance_percent: 5.13,
        prior_period: 7600000,
        change_percent: 7.89,
      },
      by_category: [
        { category: 'Personnel', amount: 4500000, budget: 4400000, variance: 100000, percent_of_total: 54.88, trend: 'stable' },
        { category: 'Technology', amount: 1800000, budget: 1600000, variance: 200000, percent_of_total: 21.95, trend: 'increasing', anomaly: true },
        { category: 'Facilities', amount: 650000, budget: 650000, variance: 0, percent_of_total: 7.93, trend: 'stable' },
        { category: 'Professional Services', amount: 750000, budget: 700000, variance: 50000, percent_of_total: 9.15, trend: 'stable' },
        { category: 'Marketing', amount: 500000, budget: 450000, variance: 50000, percent_of_total: 6.10, trend: 'increasing' },
      ],
      optimization_opportunities: [
        { id: 'opt_001', category: 'Technology', opportunity: 'Right-size unused cloud instances', potential_savings: 85000, effort: 'low', timeline: '2 weeks' },
        { id: 'opt_002', category: 'Software Licenses', opportunity: 'Consolidate redundant SaaS tools', potential_savings: 45000, effort: 'medium', timeline: '1 month' },
      ],
    };
  }

  async getVendorSpend(query: GetCostDto) {
    return {
      period: 'YTD 2026',
      total_vendor_spend: 12500000,
      vendor_count: 245,
      top_vendors: [
        { id: 'ven_001', name: 'Amazon Web Services', category: 'Cloud Infrastructure', ytd_spend: 2800000, budget: 2500000, variance: 300000, contract_end_date: '2026-12-31', risk_score: 'medium' },
        { id: 'ven_002', name: 'Salesforce', category: 'CRM', ytd_spend: 850000, budget: 800000, variance: 50000, contract_end_date: '2027-03-15', risk_score: 'low' },
        { id: 'ven_003', name: 'Workday', category: 'HRIS', ytd_spend: 450000, budget: 450000, variance: 0, contract_end_date: '2026-09-30', risk_score: 'low' },
      ],
      by_category: [
        { category: 'Cloud Infrastructure', spend: 3200000, vendor_count: 8 },
        { category: 'SaaS Applications', spend: 2100000, vendor_count: 45 },
        { category: 'Professional Services', spend: 1800000, vendor_count: 32 },
      ],
    };
  }

  async getCostDrivers(query: GetCostDto) {
    return {
      analysis_period: 'January 2026',
      total_cost_change: 600000,
      drivers: [
        { driver: 'Headcount Growth', impact: 350000, impact_percent: 58.33, direction: 'increase', details: '12 new hires in Engineering and Sales', controllable: true },
        { driver: 'Cloud Usage Growth', impact: 150000, impact_percent: 25.0, direction: 'increase', details: '40% increase in compute hours', controllable: true },
        { driver: 'Annual License Renewals', impact: 80000, impact_percent: 13.33, direction: 'increase', details: '5% price increase across SaaS tools', controllable: false },
        { driver: 'Travel Optimization', impact: -30000, impact_percent: -5.0, direction: 'decrease', details: 'Shift to virtual meetings', controllable: true },
      ],
    };
  }

  async getOptimizations() {
    return {
      total_potential_savings: 285000,
      opportunities: [
        { id: 'opt_001', category: 'Technology', title: 'Right-size cloud instances', description: '45 instances identified as over-provisioned', savings: 85000, effort: 'low', timeline: '2 weeks', status: 'identified' },
        { id: 'opt_002', category: 'SaaS', title: 'Consolidate project management tools', description: '3 overlapping tools (Asana, Monday, Jira)', savings: 45000, effort: 'medium', timeline: '1 month', status: 'in_review' },
        { id: 'opt_003', category: 'Contracts', title: 'Renegotiate Salesforce contract', description: 'Contract expires Q3 - leverage usage data', savings: 120000, effort: 'high', timeline: '3 months', status: 'planned' },
        { id: 'opt_004', category: 'Process', title: 'Automate expense reporting', description: 'Manual processing costs $35K annually', savings: 35000, effort: 'medium', timeline: '2 months', status: 'identified' },
      ],
    };
  }

  async getCostTrends(query: GetCostDto) {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    return {
      period: 'last_6_months',
      trends: {
        total_costs: { periods: months, values: [7200000, 7400000, 7500000, 7600000, 7800000, 8200000], budget: [7100000, 7200000, 7300000, 7400000, 7500000, 7800000] },
        by_category: {
          Personnel: { periods: months, values: [4100000, 4200000, 4250000, 4300000, 4400000, 4500000] },
          Technology: { periods: months, values: [1400000, 1450000, 1500000, 1550000, 1650000, 1800000] },
          Marketing: { periods: months, values: [380000, 400000, 420000, 440000, 460000, 500000] },
        },
      },
    };
  }
}
