import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { GetPipelineDto } from './dto';

@Injectable()
export class SalesService {
  constructor(private readonly dataService: DataService) {}

  getSalesData() {
    return {
      closedAcv: this.dataService.getClosedAcv(),
      pipelineSnapshots: this.dataService.getPipelineSnapshots(),
      salesTeam: this.dataService.getSalesTeam(),
      customerNameMappings: this.dataService.getCustomerNameMappings(),
      sowMappings: this.dataService.getSowMappings(),
      arrSubCategoryBreakdown: this.dataService.getArrSubCategoryBreakdown(),
      productCategoryMapping: this.dataService.getProductCategoryMapping(),
      priorYearPerformance: this.dataService.getPriorYearPerformance(),
    };
  }

  async getPipelineOverview(query: GetPipelineDto) {
    const closedAcv = this.dataService.getClosedAcv();
    const pipeline = this.dataService.getPipelineSnapshots();
    const team = this.dataService.getSalesTeam();

    const wonDeals = closedAcv.filter(d => d.Logo_Type);
    const totalClosed = wonDeals.reduce((s, d) => s + d.Amount, 0);
    const totalPipeline = pipeline.reduce((s, d) => s + d.Deal_Value, 0);
    const weightedPipeline = pipeline.reduce(
      (s, d) => s + d.Deal_Value * (d.Probability / 100),
      0,
    );

    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation'];
    const byStage = stages.map((stage, i) => {
      const deals = pipeline.filter(d => d.Deal_Stage === stage || d.Current_Stage === stage);
      const value = deals.reduce((s, d) => s + d.Deal_Value, 0);
      return {
        stage,
        stage_order: i + 1,
        value,
        weighted_value: deals.reduce((s, d) => s + d.Deal_Value * (d.Probability / 100), 0),
        count: deals.length,
        probability: deals.length > 0 ? deals.reduce((s, d) => s + d.Probability, 0) / deals.length / 100 : 0,
      };
    });

    return {
      period: query.period || 'current_quarter',
      summary: {
        total_pipeline: totalPipeline,
        weighted_pipeline: weightedPipeline,
        deal_count: pipeline.length,
        average_deal_size: pipeline.length > 0 ? Math.round(totalPipeline / pipeline.length) : 0,
        total_closed: totalClosed,
        team_size: team.length,
      },
      by_stage: byStage,
    };
  }

  async getSalesMetrics(query: GetPipelineDto) {
    const closedAcv = this.dataService.getClosedAcv();
    const pipeline = this.dataService.getPipelineSnapshots();
    const team = this.dataService.getSalesTeam();

    const totalClosed = closedAcv.reduce((s, d) => s + d.Amount, 0);
    const totalQuota = team.reduce((s, t) => s + t.Annual_Quota, 0);

    return {
      period: query.period || 'current',
      metrics: {
        quota_attainment: {
          current: totalQuota > 0 ? totalClosed / totalQuota : 0,
          target: 1.0,
        },
        average_deal_size: {
          current: closedAcv.length > 0 ? Math.round(totalClosed / closedAcv.length) : 0,
        },
        pipeline_count: pipeline.length,
        team_size: team.length,
      },
    };
  }

  async getSalesTrends(query: GetPipelineDto) {
    const pipeline = this.dataService.getPipelineSnapshots();

    const monthMap = new Map<string, { value: number; count: number }>();
    pipeline.forEach(d => {
      const month = d.Snapshot_Month?.slice(0, 7) || '';
      if (!month) return;
      const entry = monthMap.get(month) || { value: 0, count: 0 };
      entry.value += d.Deal_Value;
      entry.count++;
      monthMap.set(month, entry);
    });

    const sortedMonths = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    return {
      period: query.period || 'all',
      trends: {
        pipeline_value: {
          periods: sortedMonths.map(([m]) => m),
          values: sortedMonths.map(([, v]) => v.value),
        },
        deal_count: {
          periods: sortedMonths.map(([m]) => m),
          values: sortedMonths.map(([, v]) => v.count),
        },
      },
    };
  }
}
