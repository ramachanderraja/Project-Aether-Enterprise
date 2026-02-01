import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GetPipelineDto } from './dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPipelineOverview(query: GetPipelineDto) {
    const period = query.period || 'current_quarter';

    // Sample pipeline data - in production, query from database
    return {
      period: 'Q1 2026',
      summary: {
        total_pipeline: 45000000,
        weighted_pipeline: 22500000,
        deal_count: 156,
        average_deal_size: 288462,
        win_rate: 0.32,
        average_sales_cycle_days: 87,
      },
      by_stage: [
        {
          stage: 'Prospecting',
          stage_order: 1,
          value: 8500000,
          weighted_value: 850000,
          count: 45,
          probability: 0.10,
          avg_days_in_stage: 12,
        },
        {
          stage: 'Qualification',
          stage_order: 2,
          value: 12000000,
          weighted_value: 3000000,
          count: 38,
          probability: 0.25,
          avg_days_in_stage: 18,
        },
        {
          stage: 'Proposal',
          stage_order: 3,
          value: 15000000,
          weighted_value: 7500000,
          count: 42,
          probability: 0.50,
          avg_days_in_stage: 21,
        },
        {
          stage: 'Negotiation',
          stage_order: 4,
          value: 9500000,
          weighted_value: 7125000,
          count: 31,
          probability: 0.75,
          avg_days_in_stage: 14,
        },
      ],
      forecast: {
        best_case: 18000000,
        commit: 12500000,
        most_likely: 14200000,
        target: 15000000,
        gap_to_target: 800000,
      },
      trends: {
        pipeline_change_30d: 2500000,
        pipeline_change_percent: 5.9,
        deals_added_30d: 28,
        deals_closed_won_30d: 12,
        deals_closed_lost_30d: 8,
      },
    };
  }

  async getSalesMetrics(query: GetPipelineDto) {
    return {
      period: query.period || 'Q1 2026',
      metrics: {
        quota_attainment: {
          current: 0.78,
          target: 1.0,
          trend: 'on_track',
        },
        win_rate: {
          current: 0.32,
          previous: 0.29,
          change: 0.03,
        },
        average_deal_size: {
          current: 288462,
          previous: 265000,
          change_percent: 8.85,
        },
        sales_cycle: {
          average_days: 87,
          by_segment: {
            enterprise: 120,
            midmarket: 75,
            smb: 45,
          },
        },
        conversion_rates: {
          prospecting_to_qualified: 0.45,
          qualified_to_proposal: 0.65,
          proposal_to_negotiation: 0.55,
          negotiation_to_closed: 0.70,
        },
        activity_metrics: {
          calls_per_deal: 12,
          meetings_per_deal: 5,
          emails_per_deal: 35,
        },
      },
    };
  }

  async getSalesTrends(query: GetPipelineDto) {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

    return {
      period: query.period || 'last_6_months',
      trends: {
        pipeline_value: {
          periods: months,
          values: [38000000, 40000000, 41500000, 43000000, 44000000, 45000000],
        },
        deals_created: {
          periods: months,
          values: [42, 38, 45, 50, 35, 48],
        },
        deals_closed_won: {
          periods: months,
          values: [8, 10, 12, 9, 14, 12],
        },
        revenue_closed: {
          periods: months,
          values: [2100000, 2500000, 3200000, 2400000, 3800000, 3500000],
        },
        average_deal_size: {
          periods: months,
          values: [262500, 250000, 266667, 266667, 271429, 291667],
        },
      },
    };
  }
}
