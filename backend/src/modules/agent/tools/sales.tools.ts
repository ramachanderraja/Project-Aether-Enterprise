import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesService } from '../../sales/sales.service';
import { DealService } from '../../sales/services/deal.service';
import { ForecastService } from '../../sales/services/forecast.service';

const MAX_ITEMS = 50;

function truncate<T>(arr: T[], label: string): { data: T[]; truncated: boolean; total: number } {
  if (arr.length <= MAX_ITEMS) return { data: arr, truncated: false, total: arr.length };
  return { data: arr.slice(0, MAX_ITEMS), truncated: true, total: arr.length };
}

export function createSalesTools(
  salesService: SalesService,
  dealService: DealService,
  forecastService: ForecastService,
) {
  const getPipelineOverview = tool(
    async ({ period }) => {
      const result = await salesService.getPipelineOverview({ period });
      return JSON.stringify(result);
    },
    {
      name: 'get_pipeline_overview',
      description:
        'Get a summary of the sales pipeline including total value, weighted value, deal count, and breakdown by stage.',
      schema: z.object({
        period: z
          .string()
          .optional()
          .describe('Time period (e.g. "current_quarter", "Q1 2026")'),
      }),
    },
  );

  const getSalesMetrics = tool(
    async ({ period }) => {
      const result = await salesService.getSalesMetrics({ period });
      return JSON.stringify(result);
    },
    {
      name: 'get_sales_metrics',
      description:
        'Get sales KPIs including quota attainment, average deal size, pipeline count, and team size.',
      schema: z.object({
        period: z.string().optional().describe('Time period filter'),
      }),
    },
  );

  const getSalesTrends = tool(
    async ({ period }) => {
      const result = await salesService.getSalesTrends({ period });
      return JSON.stringify(result);
    },
    {
      name: 'get_sales_trends',
      description:
        'Get monthly trends for pipeline value and deal count over time.',
      schema: z.object({
        period: z.string().optional().describe('Time period filter'),
      }),
    },
  );

  const getDeals = tool(
    async ({ stage, risk_level, page, limit }) => {
      const result = await dealService.getDeals({
        stage,
        risk_level,
        page: page || 1,
        limit: Math.min(limit || 20, MAX_ITEMS),
      });
      return JSON.stringify(result);
    },
    {
      name: 'get_deals',
      description:
        'Get a paginated list of deals with optional filters by stage or risk level.',
      schema: z.object({
        stage: z
          .string()
          .optional()
          .describe('Filter by stage: Prospecting, Qualification, Proposal, Negotiation'),
        risk_level: z
          .string()
          .optional()
          .describe('Filter by risk: low, medium, high'),
        page: z.number().optional().describe('Page number (default 1)'),
        limit: z.number().optional().describe('Items per page (default 20, max 50)'),
      }),
    },
  );

  const getDealById = tool(
    async ({ deal_id }) => {
      const result = await dealService.getDealById(deal_id);
      return JSON.stringify(result);
    },
    {
      name: 'get_deal_by_id',
      description:
        'Get detailed information about a specific deal including stage history, contacts, and activities.',
      schema: z.object({
        deal_id: z.string().describe('The deal ID (e.g. "deal_001")'),
      }),
    },
  );

  const getAtRiskDeals = tool(
    async () => {
      const result = await dealService.getAtRiskDeals();
      return JSON.stringify(result);
    },
    {
      name: 'get_at_risk_deals',
      description:
        'Get all deals flagged as medium or high risk, with their total value.',
      schema: z.object({}),
    },
  );

  const getForecast = tool(
    async ({ period }) => {
      const result = await forecastService.getForecast({ period });
      return JSON.stringify(result);
    },
    {
      name: 'get_forecast',
      description:
        'Get revenue forecast with pessimistic/most_likely/optimistic scenarios, weekly projections, risk factors, and deal-by-deal forecasts.',
      schema: z.object({
        period: z
          .string()
          .optional()
          .describe('Forecast period (e.g. "Q1 2026")'),
      }),
    },
  );

  const runMonteCarlo = tool(
    async ({ iterations }) => {
      // Build pipeline data from deals
      const deals = await dealService.getDeals({ limit: 50 });
      const pipelineData = {
        deals: deals.data.map((d: any) => ({
          amount: d.amount,
          probability: d.probability,
        })),
      };
      const result = await forecastService.runMonteCarlo(
        pipelineData,
        iterations || 1000,
      );
      return JSON.stringify(result);
    },
    {
      name: 'run_monte_carlo',
      description:
        'Run a Monte Carlo simulation on the current pipeline to get probability distribution of forecast outcomes including mean, median, percentiles.',
      schema: z.object({
        iterations: z
          .number()
          .optional()
          .describe('Number of simulation iterations (default 1000)'),
      }),
    },
  );

  return [
    getPipelineOverview,
    getSalesMetrics,
    getSalesTrends,
    getDeals,
    getDealById,
    getAtRiskDeals,
    getForecast,
    runMonteCarlo,
  ];
}
