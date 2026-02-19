import { Injectable } from '@nestjs/common';
import { GetPipelineDto } from '../dto';

@Injectable()
export class ForecastService {

  async getForecast(query: GetPipelineDto) {
    const period = query.period || 'Q1 2026';

    return {
      period,
      forecast_date: new Date().toISOString().split('T')[0],
      target: 15000000,
      scenarios: {
        pessimistic: {
          value: 11500000,
          probability: 0.20,
          gap_to_target: -3500000,
          assumptions: [
            '3 at-risk deals slip to Q2',
            'Conservative conversion rates',
          ],
        },
        most_likely: {
          value: 14200000,
          probability: 0.55,
          gap_to_target: -800000,
          assumptions: [
            'Current pipeline conversion rates',
            'No major deal slippage',
          ],
        },
        optimistic: {
          value: 17500000,
          probability: 0.25,
          gap_to_target: 2500000,
          assumptions: [
            '2 early close opportunities convert',
            'Improved conversion from new marketing campaign',
          ],
        },
      },
      weekly_projections: [
        { week: '2026-W05', cumulative_closed: 3200000, remaining_target: 11800000 },
        { week: '2026-W06', cumulative_closed: 5100000, remaining_target: 9900000 },
        { week: '2026-W07', cumulative_closed: 7800000, remaining_target: 7200000 },
        { week: '2026-W08', cumulative_closed: 10200000, remaining_target: 4800000 },
        { week: '2026-W09', cumulative_closed: 12500000, remaining_target: 2500000 },
        { week: '2026-W10', cumulative_closed: 14200000, remaining_target: 800000 },
      ],
      coverage_ratio: 3.0,
      ai_confidence: 0.78,
      risk_factors: [
        {
          factor: '2 large deals with delayed legal review',
          impact: -1200000,
          mitigation: 'Escalate to executive sponsor',
        },
        {
          factor: 'Competitor aggressive pricing in EMEA',
          impact: -500000,
          mitigation: 'Value-based selling training',
        },
      ],
      opportunities: [
        {
          opportunity: 'Upsell potential in 5 existing accounts',
          impact: 800000,
          action: 'Launch expansion campaign',
        },
        {
          opportunity: 'New enterprise leads from conference',
          impact: 600000,
          action: 'Prioritize follow-ups',
        },
      ],
      deal_by_deal_forecast: [
        {
          deal_id: 'deal_001',
          name: 'Acme Corp Enterprise License',
          amount: 450000,
          close_date: '2026-03-15',
          ai_probability: 0.82,
          forecast_category: 'commit',
        },
        {
          deal_id: 'deal_002',
          name: 'TechStart Inc Platform',
          amount: 180000,
          close_date: '2026-02-28',
          ai_probability: 0.45,
          forecast_category: 'best_case',
        },
        {
          deal_id: 'deal_003',
          name: 'Global Industries Expansion',
          amount: 520000,
          close_date: '2026-04-30',
          ai_probability: 0.30,
          forecast_category: 'pipeline',
        },
      ],
    };
  }

  async runMonteCarlo(pipelineData: any, iterations: number = 1000) {
    // Simplified Monte Carlo simulation
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      let totalClosed = 0;

      // Simulate each deal
      for (const deal of pipelineData.deals || []) {
        const random = Math.random();
        if (random < deal.probability) {
          totalClosed += deal.amount;
        }
      }

      results.push(totalClosed);
    }

    // Sort results
    results.sort((a, b) => a - b);

    return {
      iterations,
      mean: results.reduce((a, b) => a + b, 0) / iterations,
      median: results[Math.floor(iterations / 2)],
      std_dev: this.calculateStdDev(results),
      percentiles: {
        p10: results[Math.floor(iterations * 0.1)],
        p25: results[Math.floor(iterations * 0.25)],
        p75: results[Math.floor(iterations * 0.75)],
        p90: results[Math.floor(iterations * 0.9)],
      },
    };
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}
