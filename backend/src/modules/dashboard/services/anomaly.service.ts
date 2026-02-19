import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAnomaliesDto, UpdateAnomalyDto } from '../dto';

@Injectable()
export class AnomalyService {
  async getAnomalies(query: GetAnomaliesDto) {
    const {
      severity,
      status,
      category,
      page = 1,
      limit = 20,
    } = query;

    const sampleAnomalies = [
      {
        id: 'anom_001',
        severity: 'high',
        category: 'cost_spike',
        metric_name: 'Cloud Infrastructure',
        account_code: '6200-100',
        description: 'AWS spending 47% above forecast this month',
        current_value: 245000,
        expected_value: 166000,
        variance_amount: 79000,
        variance_percent: 47.6,
        detected_at: new Date().toISOString(),
        status: 'unresolved',
        assigned_to: null,
        root_cause_analysis: {
          ai_generated: true,
          summary: 'Spike attributed to increased data processing volumes following product launch',
          contributing_factors: [
            '30% increase in API calls',
            'New ML model training jobs',
            'Unoptimized database queries',
          ],
          confidence: 0.87,
        },
        recommended_actions: [
          'Review recent deployments for inefficiencies',
          'Implement auto-scaling policies',
          'Optimize top 5 expensive queries',
        ],
      },
      {
        id: 'anom_002',
        severity: 'medium',
        category: 'revenue_drop',
        metric_name: 'EMEA Revenue',
        account_code: '4000-200',
        description: 'EMEA region 8% below Q1 target',
        current_value: 2875000,
        expected_value: 3125000,
        variance_amount: -250000,
        variance_percent: -8.0,
        detected_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'investigating',
        assigned_to: 'usr_analyst01',
        root_cause_analysis: {
          ai_generated: true,
          summary: 'Slower enterprise deal closures due to budget freezes',
          contributing_factors: [
            '3 large deals pushed to Q2',
            'Currency headwinds (EUR)',
            'Competitor pricing pressure',
          ],
          confidence: 0.72,
        },
        recommended_actions: [
          'Accelerate mid-market pipeline',
          'Review pricing strategy for EMEA',
          'Schedule executive engagement for delayed deals',
        ],
      },
      {
        id: 'anom_003',
        severity: 'low',
        category: 'pattern',
        metric_name: 'Travel Expenses',
        account_code: '6500-300',
        description: 'Travel spending pattern deviation detected',
        current_value: 85000,
        expected_value: 120000,
        variance_amount: -35000,
        variance_percent: -29.2,
        detected_at: new Date(Date.now() - 172800000).toISOString(),
        status: 'resolved',
        assigned_to: null,
        root_cause_analysis: {
          ai_generated: true,
          summary: 'Reduced travel due to virtual meeting adoption',
          contributing_factors: ['Shift to virtual customer meetings', 'Q1 travel policy update'],
          confidence: 0.95,
        },
        recommended_actions: ['Update budget forecast to reflect new travel patterns'],
      },
    ];

    let filtered = sampleAnomalies;
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (severity) filtered = filtered.filter((a) => a.severity === severity);
    if (category) filtered = filtered.filter((a) => a.category === category);

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_previous: page > 1,
      },
    };
  }

  async getAnomalyById(anomalyId: string) {
    const anomalies = await this.getAnomalies({ limit: 100 });
    const anomaly = anomalies.data.find((a: any) => a.id === anomalyId);

    if (!anomaly) {
      throw new NotFoundException(`Anomaly ${anomalyId} not found`);
    }

    return anomaly;
  }

  async updateAnomaly(anomalyId: string, updateDto: UpdateAnomalyDto) {
    const anomaly = await this.getAnomalyById(anomalyId);

    return {
      ...anomaly,
      status: updateDto.status || anomaly.status,
      assigned_to: updateDto.assigned_to !== undefined ? updateDto.assigned_to : anomaly.assigned_to,
      notes: updateDto.notes,
      updated_at: new Date().toISOString(),
    };
  }

  async detectAnomalies(tenantId: string) {
    console.log(`Running anomaly detection for tenant ${tenantId}`);
    return { detected: 0 };
  }
}
