import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueComputeService } from '../../../../revenue/services/revenue-compute.service';

const MAX_ITEMS = 50;

const filtersSchema = z.object({
  year: z.array(z.string()).optional().describe('Filter by year(s), e.g. ["2026"]'),
  month: z.array(z.string()).optional().describe('Filter by month name(s), e.g. ["Jan","Dec"]'),
  region: z.array(z.string()).optional().describe('Filter by region(s): North America, Europe, LATAM, Middle East, APAC'),
  vertical: z.array(z.string()).optional().describe('Filter by vertical(s)'),
  segment: z.array(z.string()).optional().describe('Filter by segment(s): Enterprise, SMB'),
  platform: z.array(z.string()).optional().describe('Filter by platform(s): Quantum, SMART, Cost Drivers, Opus'),
  quantumSmart: z.string().optional().describe('Single select: Quantum, SMART, or All'),
});

export function createMovementTools(revenueCompute: RevenueComputeService) {
  const getMovementSummary = tool(
    async (filters) => {
      const { lookbackPeriod, ...baseFilters } = filters;
      const result = revenueCompute.getMovementSummary({
        ...baseFilters,
        lookbackPeriod: lookbackPeriod || 1,
      });
      return JSON.stringify(result);
    },
    {
      name: 'get_movement_summary',
      description:
        'Get ARR Movement summary with waterfall: Starting ARR, New Business, Expansion, Schedule Change, Contraction, Churn, Ending ARR. Matches the ARR Bridge Waterfall chart and summary cards on the ARR Movement tab.',
      schema: filtersSchema.extend({
        lookbackPeriod: z.number().optional().describe('Lookback period in months (1, 3, 6, or 12). Default 1.'),
      }),
    },
  );

  const getMovementCustomers = tool(
    async (filters) => {
      const { lookbackPeriod, movementType, sortField, sortDirection, ...baseFilters } = filters;
      const result = revenueCompute.getMovementCustomers({
        ...baseFilters,
        lookbackPeriod: lookbackPeriod || 1,
        movementType: movementType || undefined,
        sortField: sortField || undefined,
        sortDirection: sortDirection || undefined,
      });
      const customers = result.customers;
      const truncated = customers.length > MAX_ITEMS;
      return JSON.stringify({
        data: customers.slice(0, MAX_ITEMS),
        truncated,
        total: customers.length,
      });
    },
    {
      name: 'get_movement_customers',
      description:
        'Get CUSTOMER-LEVEL ARR movement details: each customer\'s name, starting ARR, ending ARR, new business, expansion, contraction, churn amounts, and % change. Use this to answer "which customers expanded/contracted/churned?" or "top expanding customers". Filter by movementType to get only Expansion, Contraction, Churn, New Business, or Schedule Change customers. Results sorted by absolute change (largest movers first).',
      schema: filtersSchema.extend({
        lookbackPeriod: z.number().optional().describe('Lookback period in months (1, 3, 6, or 12). Default 1.'),
        movementType: z.string().optional().describe('Filter by movement type: "Expansion", "Contraction", "Churn", "New Business", "Schedule Change". Omit for all movement types.'),
        sortField: z.string().optional().describe('Sort by field: customerName, startingARR, endingARR, expansion, contraction, churn, change, changePercent'),
        sortDirection: z.string().optional().describe('Sort direction: asc or desc (default: desc by absolute change)'),
      }),
    },
  );

  const getMovementTrend = tool(
    async (filters) => {
      const result = revenueCompute.getMovementTrend(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_movement_trend',
      description:
        'Get monthly ARR movement trend from Jan 2024 to present: for each month, shows new business, expansion, schedule change, contraction, churn, and net change amounts. Matches the stacked bar chart on the ARR Movement tab. Use to see how movements trend over time.',
      schema: filtersSchema,
    },
  );

  return [getMovementSummary, getMovementCustomers, getMovementTrend];
}
