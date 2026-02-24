import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueService } from '../../../../revenue/revenue.service';
import { RevenueComputeService } from '../../../../revenue/services/revenue-compute.service';

const filtersSchema = z.object({
  year: z.array(z.string()).optional().describe('Filter by year(s), e.g. ["2026"]'),
  month: z.array(z.string()).optional().describe('Filter by month name(s), e.g. ["Jan","Dec"]'),
  region: z.array(z.string()).optional().describe('Filter by region(s): North America, Europe, LATAM, Middle East, APAC'),
  vertical: z.array(z.string()).optional().describe('Filter by vertical(s)'),
  segment: z.array(z.string()).optional().describe('Filter by segment(s): Enterprise, SMB'),
  platform: z.array(z.string()).optional().describe('Filter by platform(s): Quantum, SMART, Cost Drivers, Opus'),
  quantumSmart: z.string().optional().describe('Single select: Quantum, SMART, or All'),
});

export function createOverviewTools(
  revenueService: RevenueService,
  revenueCompute: RevenueComputeService,
) {
  const getArrOverviewMetrics = tool(
    async (filters) => {
      const result = revenueCompute.getOverviewMetrics(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_arr_overview_metrics',
      description:
        'Get full ARR Overview KPI cards: Current ARR, Year-End Forecasted ARR, Month Forecast, Monthly NRR %, Monthly GRR %, Full-Year NRR, Full-Year GRR, expansion, contraction, churn, schedule change. Matches exactly what the user sees on the Revenue Overview tab.',
      schema: filtersSchema,
    },
  );

  const getArrTrend = tool(
    async (filters) => {
      const result = revenueCompute.getOverviewArrTrend(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_arr_trend',
      description:
        'Get ARR Trend over time: month-by-month actual and forecasted ARR from Jan 2024 to Dec 2026. Matches the area chart on the Overview tab. Forecast months show base + renewals + new business breakdown.',
      schema: filtersSchema,
    },
  );

  const getArrByDimension = tool(
    async (filters) => {
      const result = revenueCompute.getOverviewArrByDimension(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_arr_by_dimension',
      description:
        'Get ARR breakdown by region, vertical, and product category. Returns three sorted lists. Matches the horizontal bar charts and donut chart on the Overview tab.',
      schema: filtersSchema,
    },
  );

  const getRevenueOverview = tool(
    async ({ period }) => {
      const result = await revenueService.getRevenueOverview(period);
      return JSON.stringify(result);
    },
    {
      name: 'get_revenue_overview',
      description:
        'Get a basic summary of revenue: total ARR, new ARR, expansion, contraction, churn, closed ACV. Use get_arr_overview_metrics for the full KPI card data.',
      schema: z.object({
        period: z.string().optional().describe('Time period filter'),
      }),
    },
  );

  return [getArrOverviewMetrics, getArrTrend, getArrByDimension, getRevenueOverview];
}
