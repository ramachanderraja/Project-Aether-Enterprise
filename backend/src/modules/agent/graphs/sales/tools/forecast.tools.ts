import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesComputeService } from '../../../../sales/services/sales-compute.service';
import { DealService } from '../../../../sales/services/deal.service';
import { ForecastService } from '../../../../sales/services/forecast.service';

const filtersSchema = z.object({
  year: z.array(z.string()).optional().describe('Filter by year(s), e.g. ["2026"]'),
  quarter: z.array(z.string()).optional().describe('Filter by quarter(s), e.g. ["Q1","Q2"]'),
  month: z.array(z.string()).optional().describe('Filter by month name(s), e.g. ["Jan","Feb"]'),
  region: z.array(z.string()).optional().describe('Filter by region(s): North America, Europe, LATAM, Middle East, APAC'),
  vertical: z.array(z.string()).optional().describe('Filter by vertical(s): Life Sciences, CPG & Retail, BFSI, etc.'),
  segment: z.array(z.string()).optional().describe('Filter by segment(s): Enterprise, SMB'),
  logoType: z.array(z.string()).optional().describe('Filter by logo type(s): New Logo, Upsell, Cross-Sell, Extension'),
  revenueType: z.string().optional().describe('Revenue type: License, Implementation, or All (default All)'),
});

export function createForecastTools(
  salesCompute: SalesComputeService,
  dealService: DealService,
  forecastService: ForecastService,
) {
  const getForecastRegional = tool(
    async (filters) => {
      const result = salesCompute.getForecastRegional(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_regional_performance',
      description:
        'Get Regional Performance table: Region, Closed ACV, Forecast, Previous Year, Variance, YoY Growth %, Trend — for North America, Europe, LATAM, Middle East, APAC. Matches the table on the Forecast Deep Dive tab.',
      schema: filtersSchema,
    },
  );

  const getForecastTrend = tool(
    async (filters) => {
      const result = salesCompute.getForecastTrend(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_forecast_trend',
      description:
        'Get Forecast Trend line chart data: cumulative monthly forecast vs previous year (Jan–Dec). Matches the line chart on the Forecast Deep Dive tab.',
      schema: filtersSchema,
    },
  );

  const getForecastBySubcategory = tool(
    async (filters) => {
      const result = salesCompute.getForecastBySubcategory(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_forecast_by_subcategory',
      description:
        'Get Forecast by Sub-Category table: Sub-Category, Category, Weighted Forecast, % of Total, Deal count. Matches the table on the Forecast Deep Dive tab.',
      schema: filtersSchema,
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
        'Get revenue forecast with pessimistic/most_likely/optimistic scenarios, weekly projections, risk factors, opportunities, and deal-by-deal forecasts. Use for scenario analysis and AI-driven forecast insights.',
      schema: z.object({
        period: z.string().optional().describe('Forecast period (e.g. "Q1 2026")'),
      }),
    },
  );

  const runMonteCarlo = tool(
    async ({ iterations }) => {
      const deals = await dealService.getDeals({ limit: 50 });
      const pipelineData = {
        deals: deals.data.map((d: any) => ({
          amount: d.amount,
          probability: d.probability,
        })),
      };
      const result = await forecastService.runMonteCarlo(pipelineData, iterations || 1000);
      return JSON.stringify(result);
    },
    {
      name: 'run_monte_carlo',
      description:
        'Run a Monte Carlo simulation on the current pipeline to get probability distribution of forecast outcomes including mean, median, percentiles (p10, p25, p75, p90).',
      schema: z.object({
        iterations: z.number().optional().describe('Number of simulation iterations (default 1000)'),
      }),
    },
  );

  return [
    getForecastRegional,
    getForecastTrend,
    getForecastBySubcategory,
    getForecast,
    runMonteCarlo,
  ];
}
