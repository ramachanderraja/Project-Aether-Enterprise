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
});

export function createYoYTools(salesCompute: SalesComputeService) {
  const getSalesRepPerformance = tool(
    async (filters) => {
      const result = salesCompute.getQuotaSalespeople(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_sales_rep_performance',
      description:
        'Get Sales Rep Performance table: Salesperson, Region, Closed YTD, Forecast, Pipeline, Previous Year, Pipeline Coverage (multiplier), YTD vs PY %, Forecast vs PY %. Managers are highlighted and show rollup totals including direct reports. Matches the main table on the YoY Performance tab.',
      schema: filtersSchema.extend({
        nameFilter: z.string().optional().describe('Search by salesperson name'),
        regionFilter: z.string().optional().describe('Filter by specific region'),
        sortField: z.string().optional().describe('Field to sort by (e.g. closedYTD, forecastAttainment)'),
        sortDirection: z.string().optional().describe('asc or desc'),
      }),
    },
  );

  const getMonthlyAttainmentHeatmap = tool(
    async (filters) => {
      const result = salesCompute.getQuotaSalespeople(filters);
      const heatmapData = result.salespeople.map((sp: any) => ({
        name: sp.name,
        region: sp.region,
        isManager: sp.isManager,
        level: sp.level,
        months: (sp.monthlyAttainment as number[]).map((pct: number, i: number) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          attainmentPct: pct,
          color: pct >= 100 ? 'green' : pct >= 75 ? 'yellow' : pct > 0 ? 'red' : 'gray',
        })),
        avgAttainment: Math.round(
          (sp.monthlyAttainment as number[]).filter((v: number) => v > 0).reduce((a: number, b: number) => a + b, 0) /
            Math.max((sp.monthlyAttainment as number[]).filter((v: number) => v > 0).length, 1),
        ),
      }));

      return JSON.stringify({
        heatmap: heatmapData,
        monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        legend: { green: '≥100% attainment', yellow: '75-99% attainment', red: '<75% attainment', gray: 'No data' },
      });
    },
    {
      name: 'get_monthly_attainment_heatmap',
      description:
        'Get the Monthly Attainment Heatmap: a Rep × Month grid showing attainment percentages color-coded (Green ≥100%, Yellow 75-99%, Red <75%). Matches the heatmap visualization on the YoY Performance tab.',
      schema: filtersSchema.extend({
        nameFilter: z.string().optional().describe('Search by salesperson name'),
        regionFilter: z.string().optional().describe('Filter by specific region'),
      }),
    },
  );

  return [getSalesRepPerformance, getMonthlyAttainmentHeatmap];
}
