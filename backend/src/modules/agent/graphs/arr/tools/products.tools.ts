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
        'Get Product sub-category performance: sub-category name, parent category, total ARR, customer count, avg ARR per customer. Matches the Category Performance table on the "By Category" view. Use get_category_summary for category-level rollups and KPIs.',
      schema: filtersSchema.extend({
        productCategory: z.string().optional().describe('Filter by product category'),
        productSubCategory: z.string().optional().describe('Filter by product sub-category'),
        feesType: z.string().optional().describe('Filter by fees type: Fees, Travel, or All'),
      }),
    },
  );

  const getCategorySummary = tool(
    async (filters) => {
      const { feesType, ...baseFilters } = filters;
      const result = revenueCompute.getCategorySummary({
        ...baseFilters,
        feesType: feesType || undefined,
      });
      return JSON.stringify(result);
    },
    {
      name: 'get_category_summary',
      description:
        'Get category-level rollup with KPIs: each category\'s total ARR, customer count, sub-category count, avg ARR/customer. Also returns summary KPIs: Total Categories, Top Category (name + ARR), Total Sub-Categories, Most Adopted category. Matches the 4 KPI cards and Category ARR Comparison bar chart on the Products tab "By Category" view.',
      schema: filtersSchema.extend({
        feesType: z.string().optional().describe('Filter by fees type: Fees, Travel, or All'),
      }),
    },
  );

  const getCustomerCategoryMatrix = tool(
    async (filters) => {
      const { feesType, search, ...baseFilters } = filters;
      const result = revenueCompute.getCustomerCategoryMatrix({
        ...baseFilters,
        feesType: feesType || undefined,
        search: search || undefined,
      });
      return JSON.stringify(result);
    },
    {
      name: 'get_customer_category_matrix',
      description:
        'Get the Customer × Category ARR matrix: each customer\'s name, region, vertical, total ARR, and ARR breakdown by product category. Includes expandable SOW-level details. Matches the Customer Category Matrix table on the Products tab "By Customer" view. Supports customer name search. Max 50 customers returned.',
      schema: filtersSchema.extend({
        feesType: z.string().optional().describe('Filter by fees type: Fees, Travel, or All'),
        search: z.string().optional().describe('Search by customer name (partial match)'),
      }),
    },
  );

  const getCrossSellAnalysis = tool(
    async (filters) => {
      const { feesType, ...baseFilters } = filters;
      const result = revenueCompute.getCrossSellAnalysis({
        ...baseFilters,
        feesType: feesType || undefined,
      });
      return JSON.stringify(result);
    },
    {
      name: 'get_cross_sell_analysis',
      description:
        'Get Cross-Sell Analysis: distribution of customers by number of sub-categories used (1, 2, 3+), cross-sell rate %, and category performance matrix (category name, customer count, total ARR, avg ARR/customer). Matches the Cross-Sell Analysis bar chart and Category Performance Matrix scatter chart on the Products tab "By Customer" view.',
      schema: filtersSchema.extend({
        feesType: z.string().optional().describe('Filter by fees type: Fees, Travel, or All'),
      }),
    },
  );

  return [getProducts, getCategorySummary, getCustomerCategoryMatrix, getCrossSellAnalysis];
}
