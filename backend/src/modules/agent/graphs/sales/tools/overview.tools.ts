import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesComputeService } from '../../../../sales/services/sales-compute.service';
import { DealService } from '../../../../sales/services/deal.service';

const MAX_ITEMS = 50;

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

export function createOverviewTools(
  salesCompute: SalesComputeService,
  dealService: DealService,
) {
  const getOverviewKpis = tool(
    async (filters) => {
      const result = salesCompute.getOverviewMetrics(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_overview_kpis',
      description:
        'Get Sales Overview KPI cards: Closed ACV, Weighted Pipeline ACV, Forecast ACV, YoY Growth %, Conversion Rate, Avg Deal Size, Sales Cycle days. Matches exactly what the user sees on the Overview tab KPI cards.',
      schema: filtersSchema,
    },
  );

  const getOverviewFunnel = tool(
    async (filters) => {
      const result = salesCompute.getOverviewFunnel(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_overview_funnel',
      description:
        'Get the Sales Funnel chart data: deal count and value by pipeline stage (Prospecting, Qualification, Proposal, Negotiation). Matches the horizontal bar chart on the Overview tab.',
      schema: filtersSchema,
    },
  );

  const getOverviewKeyDeals = tool(
    async (filters) => {
      const result = salesCompute.getOverviewKeyDeals(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_overview_key_deals',
      description:
        'Get the Key Deals in Pipeline table: top active deals with Deal Name, Account, Unweighted Fee (unweightedValue), Unweighted License ACV (unweightedLicenseValue), Unweighted Implementation Value (unweightedImplementationValue), Stage, Close Date, Probability, Owner. Deals with $0 value for the selected revenueType are automatically excluded. When the user asks about license values, pass revenueType="License". Values returned are UNWEIGHTED (raw deal value before probability adjustment). Matches the pipeline table on the Overview tab.',
      schema: filtersSchema.extend({
        sortField: z.string().optional().describe('Field to sort by'),
        sortDirection: z.string().optional().describe('asc or desc'),
        limit: z.number().optional().describe('Max deals to return (default 10)'),
      }),
    },
  );

  const getOverviewClosedDeals = tool(
    async (filters) => {
      const result = salesCompute.getOverviewClosedDeals(filters);
      const deals = result.deals;
      const truncated = deals.length > MAX_ITEMS;
      return JSON.stringify({
        data: deals.slice(0, MAX_ITEMS),
        truncated,
        total: deals.length,
      });
    },
    {
      name: 'get_overview_closed_deals',
      description:
        'Get the Closed ACV Deals table: Deal Name, Account, Logo Type, License ACV, Implementation ACV, SOW ID, Close Date — with sub-category breakdown per deal. Matches the expandable table on the Overview tab.',
      schema: filtersSchema,
    },
  );

  const getForecastByQuarter = tool(
    async (filters) => {
      const result = salesCompute.getForecastQuarterly(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_forecast_by_quarter',
      description:
        'Get Forecast by Quarter chart data: Actual (green), Forecast (blue), Previous Year (gray) for Q1-Q4. Matches the grouped bar chart on the Overview tab.',
      schema: filtersSchema,
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
        'Get a paginated list of deals from the deal database. Use for specific deal queries or when you need to look up individual deals.',
      schema: z.object({
        stage: z.string().optional().describe('Filter by stage: Prospecting, Qualification, Proposal, Negotiation'),
        risk_level: z.string().optional().describe('Filter by risk: low, medium, high'),
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

  return [
    getOverviewKpis,
    getOverviewFunnel,
    getOverviewKeyDeals,
    getOverviewClosedDeals,
    getForecastByQuarter,
    getDeals,
    getDealById,
    getAtRiskDeals,
  ];
}
