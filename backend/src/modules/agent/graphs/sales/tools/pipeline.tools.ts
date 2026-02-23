import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesComputeService } from '../../../../sales/services/sales-compute.service';

const filtersSchema = z.object({
  year: z.array(z.string()).optional().describe('Filter by year(s), e.g. ["2026"]'),
  quarter: z.array(z.string()).optional().describe('Filter by quarter(s), e.g. ["Q1","Q2"]'),
  month: z.array(z.string()).optional().describe('Filter by month name(s), e.g. ["Jan","Feb"]'),
  region: z.array(z.string()).optional().describe('Filter by region(s): North America, Europe, LATAM, Middle East, APAC'),
  vertical: z.array(z.string()).optional().describe('Filter by vertical(s)'),
  segment: z.array(z.string()).optional().describe('Filter by segment(s): Enterprise, SMB'),
  logoType: z.array(z.string()).optional().describe('Filter by logo type(s): New Logo, Upsell, Cross-Sell, Extension'),
  revenueType: z.string().optional().describe('Revenue type: License, Implementation, or All (default All)'),
  targetMonth: z.string().optional().describe('Target month in YYYY-MM format for movement comparison'),
});

export function createPipelineTools(salesCompute: SalesComputeService) {
  const getPipelineMovement = tool(
    async (filters) => {
      const result = salesCompute.getPipelineMovement(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_pipeline_movement',
      description:
        'Get Pipeline Movement analysis: Starting Pipeline, New Deals Added, Value Increased, Value Decreased, Closed Won, Lost Deals, Ending Pipeline — with waterfall chart data, key deal movement table, lost deals list, and all deal details. This single tool provides ALL data for the Pipeline Movement tab.',
      schema: filtersSchema,
    },
  );

  const getPipelineBySubcategory = tool(
    async (filters) => {
      const result = salesCompute.getPipelineBySubcategory(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_pipeline_by_subcategory',
      description:
        'Get Pipeline by Sub-Category: weighted pipeline value, deal count, and category for each product sub-category. Matches the bar chart + table on the Pipeline Movement tab.',
      schema: filtersSchema,
    },
  );

  return [getPipelineMovement, getPipelineBySubcategory];
}
