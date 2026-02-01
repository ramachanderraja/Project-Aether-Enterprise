import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateScenarioDto,
  UpdateScenarioDto,
  GetScenariosDto,
  RunSimulationDto,
  CompareScenarioDto,
  SensitivityAnalysisDto,
  ApproveScenarioDto,
} from './dto';

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  assumptions: any[];
  time_horizon: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  results?: any;
}

@Injectable()
export class ScenariosService {
  private scenarios: Map<string, Scenario> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockScenarios: Scenario[] = [
      {
        id: 'scn_001',
        name: 'FY2024 Base Budget',
        description: 'Baseline budget scenario for fiscal year 2024',
        type: 'budget',
        status: 'approved',
        assumptions: [
          { variable: 'revenue_growth', base_value: 15, unit: '%', category: 'revenue' },
          { variable: 'cost_inflation', base_value: 3, unit: '%', category: 'cost' },
          { variable: 'headcount_growth', base_value: 10, unit: '%', category: 'hr' },
          { variable: 'marketing_spend', base_value: 2500000, unit: 'USD', category: 'cost' },
        ],
        time_horizon: 12,
        created_by: 'user_001',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-15'),
        results: {
          projected_revenue: 125000000,
          projected_costs: 95000000,
          projected_ebitda: 30000000,
          ebitda_margin: 24,
        },
      },
      {
        id: 'scn_002',
        name: 'Aggressive Growth Scenario',
        description: 'What-if scenario with aggressive growth assumptions',
        type: 'what_if',
        status: 'active',
        assumptions: [
          { variable: 'revenue_growth', base_value: 25, min_value: 20, max_value: 30, unit: '%', category: 'revenue' },
          { variable: 'cost_inflation', base_value: 4, unit: '%', category: 'cost' },
          { variable: 'headcount_growth', base_value: 20, unit: '%', category: 'hr' },
          { variable: 'marketing_spend', base_value: 4000000, unit: 'USD', category: 'cost' },
        ],
        time_horizon: 12,
        created_by: 'user_001',
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-10'),
        results: {
          projected_revenue: 145000000,
          projected_costs: 115000000,
          projected_ebitda: 30000000,
          ebitda_margin: 20.7,
        },
      },
      {
        id: 'scn_003',
        name: 'Conservative Outlook',
        description: 'Conservative scenario with lower growth expectations',
        type: 'forecast',
        status: 'draft',
        assumptions: [
          { variable: 'revenue_growth', base_value: 8, min_value: 5, max_value: 12, unit: '%', category: 'revenue' },
          { variable: 'cost_inflation', base_value: 2.5, unit: '%', category: 'cost' },
          { variable: 'headcount_growth', base_value: 5, unit: '%', category: 'hr' },
          { variable: 'marketing_spend', base_value: 2000000, unit: 'USD', category: 'cost' },
        ],
        time_horizon: 12,
        created_by: 'user_002',
        created_at: new Date('2024-02-15'),
        updated_at: new Date('2024-02-15'),
      },
      {
        id: 'scn_004',
        name: 'Market Sensitivity Analysis',
        description: 'Sensitivity analysis on key market variables',
        type: 'sensitivity',
        status: 'active',
        assumptions: [
          { variable: 'market_share', base_value: 15, min_value: 10, max_value: 20, unit: '%', category: 'market' },
          { variable: 'price_elasticity', base_value: -1.2, min_value: -1.5, max_value: -0.8, unit: '', category: 'market' },
          { variable: 'customer_churn', base_value: 5, min_value: 3, max_value: 8, unit: '%', category: 'customer' },
        ],
        time_horizon: 24,
        created_by: 'user_001',
        created_at: new Date('2024-02-20'),
        updated_at: new Date('2024-02-22'),
      },
    ];

    mockScenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  async getScenarios(dto: GetScenariosDto): Promise<{
    data: Scenario[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    let scenarios = Array.from(this.scenarios.values());

    // Apply filters
    if (dto.type) {
      scenarios = scenarios.filter(s => s.type === dto.type);
    }
    if (dto.status) {
      scenarios = scenarios.filter(s => s.status === dto.status);
    }
    if (dto.created_by) {
      scenarios = scenarios.filter(s => s.created_by === dto.created_by);
    }

    // Sort by updated_at desc
    scenarios.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());

    const total = scenarios.length;
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const start = (page - 1) * limit;
    const paginatedScenarios = scenarios.slice(start, start + limit);

    return {
      data: paginatedScenarios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getScenarioById(id: string): Promise<Scenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }
    return scenario;
  }

  async createScenario(dto: CreateScenarioDto, userId: string): Promise<Scenario> {
    const id = `scn_${Date.now()}`;

    let baseAssumptions = dto.assumptions || [];

    // If copying from base scenario
    if (dto.base_scenario_id) {
      const baseScenario = await this.getScenarioById(dto.base_scenario_id);
      baseAssumptions = dto.assumptions || baseScenario.assumptions;
    }

    const scenario: Scenario = {
      id,
      name: dto.name,
      description: dto.description || '',
      type: dto.type,
      status: 'draft',
      assumptions: baseAssumptions,
      time_horizon: dto.time_horizon || 12,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.scenarios.set(id, scenario);
    return scenario;
  }

  async updateScenario(id: string, dto: UpdateScenarioDto): Promise<Scenario> {
    const scenario = await this.getScenarioById(id);

    if (scenario.status === 'approved' && dto.status !== 'archived') {
      throw new BadRequestException('Cannot modify approved scenarios except to archive');
    }

    const updated: Scenario = {
      ...scenario,
      ...dto,
      updated_at: new Date(),
    };

    this.scenarios.set(id, updated);
    return updated;
  }

  async deleteScenario(id: string): Promise<void> {
    const scenario = await this.getScenarioById(id);

    if (scenario.status === 'approved') {
      throw new BadRequestException('Cannot delete approved scenarios');
    }

    this.scenarios.delete(id);
  }

  async runSimulation(dto: RunSimulationDto): Promise<{
    scenario_id: string;
    iterations: number;
    results: any;
    confidence_intervals: any;
    distribution: any[];
  }> {
    const scenario = await this.getScenarioById(dto.scenario_id);
    const iterations = dto.iterations || 1000;
    const confidenceLevel = dto.confidence_level || 0.95;

    // Simulate Monte Carlo results
    const results = this.runMonteCarloSimulation(scenario, iterations);

    // Calculate confidence intervals
    const sortedRevenue = results.revenue_projections.sort((a, b) => a - b);
    const lowerIndex = Math.floor((1 - confidenceLevel) / 2 * iterations);
    const upperIndex = Math.floor((1 + confidenceLevel) / 2 * iterations);

    return {
      scenario_id: dto.scenario_id,
      iterations,
      results: {
        mean_revenue: this.mean(results.revenue_projections),
        mean_costs: this.mean(results.cost_projections),
        mean_ebitda: this.mean(results.ebitda_projections),
        std_revenue: this.stdDev(results.revenue_projections),
        std_ebitda: this.stdDev(results.ebitda_projections),
      },
      confidence_intervals: {
        revenue: {
          lower: sortedRevenue[lowerIndex],
          upper: sortedRevenue[upperIndex],
          confidence: confidenceLevel,
        },
        ebitda: {
          lower: results.ebitda_projections.sort((a, b) => a - b)[lowerIndex],
          upper: results.ebitda_projections.sort((a, b) => a - b)[upperIndex],
          confidence: confidenceLevel,
        },
      },
      distribution: this.createDistribution(results.ebitda_projections, 20),
    };
  }

  private runMonteCarloSimulation(scenario: Scenario, iterations: number): {
    revenue_projections: number[];
    cost_projections: number[];
    ebitda_projections: number[];
  } {
    const baseRevenue = 100000000;
    const baseCosts = 75000000;

    const revenue_projections: number[] = [];
    const cost_projections: number[] = [];
    const ebitda_projections: number[] = [];

    for (let i = 0; i < iterations; i++) {
      let revenueGrowth = 0.15;
      let costGrowth = 0.03;

      // Apply assumption variations
      scenario.assumptions.forEach(assumption => {
        if (assumption.variable === 'revenue_growth') {
          const range = (assumption.max_value || assumption.base_value * 1.2) -
                       (assumption.min_value || assumption.base_value * 0.8);
          revenueGrowth = (assumption.min_value || assumption.base_value * 0.8) +
                         Math.random() * range;
          revenueGrowth /= 100;
        }
        if (assumption.variable === 'cost_inflation') {
          costGrowth = assumption.base_value / 100 + (Math.random() - 0.5) * 0.02;
        }
      });

      const projectedRevenue = baseRevenue * (1 + revenueGrowth);
      const projectedCosts = baseCosts * (1 + costGrowth);
      const ebitda = projectedRevenue - projectedCosts;

      revenue_projections.push(projectedRevenue);
      cost_projections.push(projectedCosts);
      ebitda_projections.push(ebitda);
    }

    return { revenue_projections, cost_projections, ebitda_projections };
  }

  private mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private stdDev(arr: number[]): number {
    const avg = this.mean(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private createDistribution(arr: number[], bins: number): { bucket: string; count: number; percentage: number }[] {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const binSize = (max - min) / bins;

    const distribution = Array(bins).fill(0);
    arr.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      distribution[binIndex]++;
    });

    return distribution.map((count, index) => ({
      bucket: `${((min + index * binSize) / 1000000).toFixed(1)}M - ${((min + (index + 1) * binSize) / 1000000).toFixed(1)}M`,
      count,
      percentage: (count / arr.length) * 100,
    }));
  }

  async compareScenarios(dto: CompareScenarioDto): Promise<{
    scenarios: any[];
    comparison: any;
    variance_analysis: any[];
  }> {
    if (dto.scenario_ids.length < 2) {
      throw new BadRequestException('At least 2 scenarios required for comparison');
    }

    const scenarios = await Promise.all(
      dto.scenario_ids.map(id => this.getScenarioById(id))
    );

    const metrics = dto.metrics || ['projected_revenue', 'projected_costs', 'projected_ebitda', 'ebitda_margin'];

    const comparison: Record<string, any[]> = {};
    metrics.forEach(metric => {
      comparison[metric] = scenarios.map(s => ({
        scenario_id: s.id,
        scenario_name: s.name,
        value: s.results?.[metric] || 0,
      }));
    });

    // Calculate variance from first scenario (baseline)
    const baseline = scenarios[0];
    const variance_analysis = scenarios.slice(1).map(scenario => ({
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      vs_baseline: baseline.name,
      variances: metrics.map(metric => {
        const baseValue = baseline.results?.[metric] || 0;
        const compareValue = scenario.results?.[metric] || 0;
        const variance = compareValue - baseValue;
        const variancePercent = baseValue !== 0 ? (variance / baseValue) * 100 : 0;
        return {
          metric,
          base_value: baseValue,
          compare_value: compareValue,
          variance,
          variance_percent: variancePercent,
        };
      }),
    }));

    return {
      scenarios: scenarios.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        results: s.results,
      })),
      comparison,
      variance_analysis,
    };
  }

  async runSensitivityAnalysis(dto: SensitivityAnalysisDto): Promise<{
    scenario_id: string;
    variables: string[];
    results: any[];
    tornado_chart: any[];
  }> {
    const scenario = await this.getScenarioById(dto.scenario_id);
    const rangePercent = dto.range_percent || 20;
    const steps = dto.steps || 10;

    const results: any[] = [];
    const tornadoData: any[] = [];

    dto.variables.forEach(variable => {
      const assumption = scenario.assumptions.find(a => a.variable === variable);
      if (!assumption) return;

      const baseValue = assumption.base_value;
      const minValue = baseValue * (1 - rangePercent / 100);
      const maxValue = baseValue * (1 + rangePercent / 100);
      const stepSize = (maxValue - minValue) / steps;

      const variableResults: any[] = [];

      for (let i = 0; i <= steps; i++) {
        const testValue = minValue + i * stepSize;
        const impact = this.calculateImpact(scenario, variable, testValue);
        variableResults.push({
          input_value: testValue,
          output_revenue: impact.revenue,
          output_ebitda: impact.ebitda,
        });
      }

      results.push({
        variable,
        base_value: baseValue,
        range: { min: minValue, max: maxValue },
        sensitivity_data: variableResults,
      });

      // Calculate tornado chart data
      const lowImpact = this.calculateImpact(scenario, variable, minValue);
      const highImpact = this.calculateImpact(scenario, variable, maxValue);
      const baseImpact = this.calculateImpact(scenario, variable, baseValue);

      tornadoData.push({
        variable,
        low_value: lowImpact.ebitda - baseImpact.ebitda,
        high_value: highImpact.ebitda - baseImpact.ebitda,
        range: highImpact.ebitda - lowImpact.ebitda,
      });
    });

    // Sort tornado by absolute impact range
    tornadoData.sort((a, b) => Math.abs(b.range) - Math.abs(a.range));

    return {
      scenario_id: dto.scenario_id,
      variables: dto.variables,
      results,
      tornado_chart: tornadoData,
    };
  }

  private calculateImpact(scenario: Scenario, variable: string, value: number): { revenue: number; ebitda: number } {
    const baseRevenue = 100000000;
    const baseCosts = 75000000;

    let revenueMultiplier = 1;
    let costMultiplier = 1;

    if (variable === 'revenue_growth') {
      revenueMultiplier = 1 + value / 100;
    } else if (variable === 'cost_inflation') {
      costMultiplier = 1 + value / 100;
    } else if (variable === 'headcount_growth') {
      costMultiplier = 1 + (value / 100) * 0.6; // Labor is ~60% of costs
    } else if (variable === 'marketing_spend') {
      // Marketing as direct cost addition
      const additionalCost = value - 2500000;
      return {
        revenue: baseRevenue * 1.15 + additionalCost * 5, // 5x ROI assumption
        ebitda: baseRevenue * 1.15 + additionalCost * 5 - baseCosts * 1.03 - additionalCost,
      };
    }

    const revenue = baseRevenue * revenueMultiplier;
    const costs = baseCosts * costMultiplier;

    return {
      revenue,
      ebitda: revenue - costs,
    };
  }

  async approveScenario(id: string, dto: ApproveScenarioDto, approverId: string): Promise<Scenario> {
    const scenario = await this.getScenarioById(id);

    if (scenario.status === 'approved') {
      throw new BadRequestException('Scenario is already approved');
    }

    if (scenario.status !== 'active') {
      throw new BadRequestException('Only active scenarios can be approved');
    }

    const updated: Scenario = {
      ...scenario,
      status: 'approved',
      updated_at: new Date(),
    };

    this.scenarios.set(id, updated);

    // If setting as baseline, archive other approved scenarios of same type
    if (dto.set_as_baseline) {
      this.scenarios.forEach((s, key) => {
        if (key !== id && s.type === scenario.type && s.status === 'approved') {
          this.scenarios.set(key, { ...s, status: 'archived', updated_at: new Date() });
        }
      });
    }

    return updated;
  }

  async getScenarioVersions(id: string): Promise<any[]> {
    // Mock version history
    return [
      {
        version: 3,
        updated_at: new Date(),
        updated_by: 'user_001',
        changes: ['Updated revenue growth assumption', 'Added marketing spend variable'],
      },
      {
        version: 2,
        updated_at: new Date(Date.now() - 86400000),
        updated_by: 'user_001',
        changes: ['Adjusted cost inflation rate'],
      },
      {
        version: 1,
        updated_at: new Date(Date.now() - 172800000),
        updated_by: 'user_001',
        changes: ['Initial creation'],
      },
    ];
  }

  async cloneScenario(id: string, name: string, userId: string): Promise<Scenario> {
    const original = await this.getScenarioById(id);

    const cloned: Scenario = {
      ...original,
      id: `scn_${Date.now()}`,
      name,
      status: 'draft',
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
      results: undefined,
    };

    this.scenarios.set(cloned.id, cloned);
    return cloned;
  }
}
