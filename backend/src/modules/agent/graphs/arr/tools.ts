import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueService } from '../../../revenue/revenue.service';
import { RevenueComputeService } from '../../../revenue/services/revenue-compute.service';

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

/**
 * ARR Agent tools — uses both RevenueService (basic) and RevenueComputeService (advanced).
 *
 * Coverage: ~95% of what the Revenue screen shows.
 * Tools: 15 total (6 basic + 9 compute-backed)
 */
export function createArrTools(
  revenueService: RevenueService,
  revenueCompute: RevenueComputeService,
) {
  // ── Existing tools (using RevenueService) ──

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

  const getArrMovement = tool(
    async ({ period }) => {
      const result = await revenueService.getArrMovement(period);
      return JSON.stringify(result);
    },
    {
      name: 'get_arr_movement',
      description:
        'Get monthly ARR waterfall movements: starting, new business, expansion, schedule change, contraction, churn, ending ARR.',
      schema: z.object({
        period: z.string().optional().describe('Time period filter'),
      }),
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

  const getChurnAnalysis = tool(
    async () => {
      const result = await revenueService.getChurnAnalysis();
      return JSON.stringify(result);
    },
    {
      name: 'get_churn_analysis',
      description:
        'Get churn analysis: total churned customer count and churned ARR.',
      schema: z.object({}),
    },
  );

  const getRevenueDataSummary = tool(
    async () => {
      const data = revenueService.getRevenueData();
      return JSON.stringify({
        arrSnapshots_count: data.arrSnapshots.length,
        pipelineSnapshots_count: data.pipelineSnapshots.length,
        closedAcv_count: data.closedAcv.length,
        sowMappings_count: data.sowMappings.length,
        message: 'Use specific tools for detailed analysis.',
      });
    },
    {
      name: 'get_revenue_data_summary',
      description:
        'Get a high-level summary of available revenue data counts.',
      schema: z.object({}),
    },
  );

  // ── New tools (using RevenueComputeService) ──
  // These provide the real computed data matching the frontend screens.

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

  const getMovementSummary = tool(
    async (filters) => {
      const result = revenueCompute.getMovementSummary({
        ...filters,
        lookbackPeriod: (filters as any).lookbackPeriod || 1,
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

  const getProducts = tool(
    async (filters) => {
      const result = revenueCompute.getProducts(filters);
      return JSON.stringify(result);
    },
    {
      name: 'get_products',
      description:
        'Get Product/Category performance: sub-category, category, total ARR, customer count, avg ARR per customer. Matches the Category Performance table on the Products tab.',
      schema: filtersSchema.extend({
        productCategory: z.string().optional().describe('Filter by product category'),
        productSubCategory: z.string().optional().describe('Filter by product sub-category'),
      }),
    },
  );

  // ── Customer-level movement details (the "granular" table) ──

  const getMovementCustomers = tool(
    async (filters) => {
      const result = revenueCompute.getMovementCustomers({
        ...filters,
        lookbackPeriod: (filters as any).lookbackPeriod || 1,
        movementType: (filters as any).movementType || undefined,
        sortField: (filters as any).sortField || undefined,
        sortDirection: (filters as any).sortDirection || undefined,
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

  // ── Monthly movement trend ──

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

  // ── Full customer list with SOW details ──

  const getCustomersList = tool(
    async (filters) => {
      const result = revenueCompute.getCustomersList({
        ...filters,
        search: (filters as any).search || undefined,
        renewals2026: (filters as any).renewals2026 || undefined,
        renewalRisk: (filters as any).renewalRisk || undefined,
        sortField: (filters as any).sortField || undefined,
        sortDirection: (filters as any).sortDirection || undefined,
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

  return [
    // Existing basic tools
    getRevenueOverview,
    getArrMovement,
    getCustomerHealth,
    getCohortAnalysis,
    getChurnAnalysis,
    getRevenueDataSummary,
    // Compute-backed tools
    getArrOverviewMetrics,
    getArrTrend,
    getArrByDimension,
    getMovementSummary,
    getMovementCustomers,
    getMovementTrend,
    getCustomersList,
    getRenewalRisk,
    getProducts,
  ];
}
