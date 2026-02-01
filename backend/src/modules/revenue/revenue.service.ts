import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueOverview(period?: string) {
    return {
      period: period || 'January 2026',
      summary: {
        total_revenue: 12500000,
        recurring_revenue: 4000000,
        one_time_revenue: 8500000,
        arr: 48000000,
        mrr: 4000000,
        budget: 12000000,
        variance: 500000,
        prior_year: 10200000,
        yoy_growth: 22.55,
      },
      by_type: [
        { type: 'Subscription', amount: 4000000, percent: 32.0 },
        { type: 'License', amount: 6500000, percent: 52.0 },
        { type: 'Services', amount: 2000000, percent: 16.0 },
      ],
      by_segment: [
        { segment: 'Enterprise', amount: 8750000, percent: 70.0, growth: 25.0 },
        { segment: 'Mid-Market', amount: 2500000, percent: 20.0, growth: 18.0 },
        { segment: 'SMB', amount: 1250000, percent: 10.0, growth: 12.0 },
      ],
      by_region: [
        { region: 'North America', amount: 7500000, percent: 60.0 },
        { region: 'EMEA', amount: 3125000, percent: 25.0 },
        { region: 'APAC', amount: 1875000, percent: 15.0 },
      ],
    };
  }

  async getArrMovement(period?: string) {
    return {
      period: period || 'January 2026',
      opening_arr: 47150000,
      closing_arr: 48000000,
      movements: {
        new_business: { arr: 1200000, deals: 28, avg_arr: 42857 },
        expansion: { arr: 450000, customers: 45, upsell: 300000, cross_sell: 150000 },
        contraction: { arr: -150000, customers: 12 },
        churn: { arr: -350000, customers: 8 },
        reactivation: { arr: 100000, customers: 2 },
      },
      net_arr_change: 850000,
      ndr: 1.0063,
      grr: 0.9894,
      logo_retention: 0.9657,
    };
  }

  async getCustomerHealth(riskLevel?: string) {
    const customers = [
      { id: 'cust_001', name: 'Enterprise Corp', arr: 250000, health_score: 85, risk_level: 'healthy', churn_probability: 0.05 },
      { id: 'cust_002', name: 'At Risk Inc', arr: 150000, health_score: 45, risk_level: 'at_risk', churn_probability: 0.45 },
      { id: 'cust_003', name: 'Critical Systems', arr: 180000, health_score: 25, risk_level: 'critical', churn_probability: 0.70 },
      { id: 'cust_004', name: 'Growth Tech', arr: 120000, health_score: 92, risk_level: 'healthy', churn_probability: 0.02 },
    ];

    const filtered = riskLevel ? customers.filter(c => c.risk_level === riskLevel) : customers;

    return {
      summary: { total_customers: 485, healthy: 380, at_risk: 75, critical: 30, arr_at_risk: 4500000 },
      customers: filtered,
    };
  }

  async getCohortAnalysis() {
    return {
      cohorts: [
        { cohort: 'Q1 2025', customers: 45, initial_arr: 2800000, current_arr: 3100000, retention: 0.92, expansion: 0.18 },
        { cohort: 'Q2 2025', customers: 52, initial_arr: 3200000, current_arr: 3400000, retention: 0.94, expansion: 0.12 },
        { cohort: 'Q3 2025', customers: 48, initial_arr: 2900000, current_arr: 2950000, retention: 0.96, expansion: 0.05 },
        { cohort: 'Q4 2025', customers: 55, initial_arr: 3500000, current_arr: 3500000, retention: 0.98, expansion: 0.02 },
      ],
    };
  }

  async getChurnAnalysis() {
    return {
      period: 'Last 12 Months',
      total_churned: 42,
      churned_arr: 2100000,
      churn_rate: 0.05,
      by_reason: [
        { reason: 'Competitor', count: 15, arr: 750000, percent: 35.7 },
        { reason: 'Budget Cuts', count: 12, arr: 600000, percent: 28.6 },
        { reason: 'Company Closed', count: 8, arr: 400000, percent: 19.0 },
        { reason: 'Product Fit', count: 5, arr: 250000, percent: 11.9 },
        { reason: 'Other', count: 2, arr: 100000, percent: 4.8 },
      ],
      by_segment: [
        { segment: 'SMB', count: 28, arr: 840000, churn_rate: 0.08 },
        { segment: 'Mid-Market', count: 10, arr: 750000, churn_rate: 0.04 },
        { segment: 'Enterprise', count: 4, arr: 510000, churn_rate: 0.02 },
      ],
    };
  }
}
