import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueService } from '../../../../revenue/revenue.service';
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

export function createCustomersTools(
  revenueService: RevenueService,
  revenueCompute: RevenueComputeService,
) {
  const getCustomersList = tool(
    async (filters) => {
      const { search, renewals2026, renewalRisk, sortField, sortDirection, ...baseFilters } = filters;
      const result = revenueCompute.getCustomersList({
        ...baseFilters,
        search: search || undefined,
        renewals2026: renewals2026 || undefined,
        renewalRisk: renewalRisk || undefined,
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
      name: 'get_customers_list',
      description:
        'Get full customer list with ARR, region, vertical, SOW count, earliest renewal date, renewal risk, and expandable SOW details (SOW ID, name, ARR, fees type, contract end, risk). Use for "list all customers", "which customers have renewals coming up", "search for customer X". Supports search by name, filter 2026 renewals only, and filter by renewal risk level.',
      schema: filtersSchema.extend({
        search: z.string().optional().describe('Search by customer name (partial match)'),
        renewals2026: z.boolean().optional().describe('Set true to show only customers with 2026 renewals'),
        renewalRisk: z.string().optional().describe('Filter by renewal risk: "High Risk", "Lost", "Mgmt Approval", "In Process", "Win/PO"'),
        sortField: z.string().optional().describe('Sort by: customerName, totalARR, sowCount, earliestRenewalDate'),
        sortDirection: z.string().optional().describe('Sort direction: asc or desc'),
      }),
    },
  );

  const getRenewalRisk = tool(
    async (filters) => {
      const result = revenueCompute.getCustomerRenewalRisk(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_renewal_risk',
      description:
        'Get 2026 Renewal Risk Distribution (donut chart data) and Renewal Calendar (month-by-month SOW count and ARR). Matches the Customers tab visualizations.',
      schema: filtersSchema,
    },
  );

  const getCustomerHealth = tool(
    async ({ risk_level }) => {
      const result = await revenueService.getCustomerHealth(risk_level);
      return JSON.stringify(result);
    },
    {
      name: 'get_customer_health',
      description:
        'Get customer health data showing ARR and renewal risk. Returns up to 50 customers. Filter by risk level.',
      schema: z.object({
        risk_level: z.string().optional().describe('Filter by risk: Low, Medium, High, Critical'),
      }),
    },
  );

  const getCohortAnalysis = tool(
    async () => {
      const result = await revenueService.getCohortAnalysis();
      return JSON.stringify(result);
    },
    {
      name: 'get_cohort_analysis',
      description:
        'Get customer cohort analysis grouped by contract start year with customer count and current ARR.',
      schema: z.object({}),
    },
  );

  return [getCustomersList, getRenewalRisk, getCustomerHealth, getCohortAnalysis];
}
