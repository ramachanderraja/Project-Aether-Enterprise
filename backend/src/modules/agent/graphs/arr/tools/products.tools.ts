import { tool } from '@langchain/core/tools';
import { z } from 'zod';
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

export function createProductsTools(revenueCompute: RevenueComputeService) {
  const getProducts = tool(
    async (filters) => {
      const { productCategory, productSubCategory, feesType, ...baseFilters } = filters;
      const result = revenueCompute.getProducts({
        ...baseFilters,
        productCategory: productCategory || undefined,
        productSubCategory: productSubCategory || undefined,
        feesType: feesType || undefined,
      } as any);
      return JSON.stringify(result);
    },
    {
      name: 'get_products',
      description:
        'Get Product/Category performance: sub-category, category, total ARR, customer count, avg ARR per customer. Matches the Category Performance table on the Products tab.',
      schema: filtersSchema.extend({
        productCategory: z.string().optional().describe('Filter by product category'),
        productSubCategory: z.string().optional().describe('Filter by product sub-category'),
        feesType: z.string().optional().describe('Filter by fees type: Fees, Travel, or All'),
      }),
    },
  );

  return [getProducts];
}
