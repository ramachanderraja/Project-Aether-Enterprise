import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueService } from '../../revenue/revenue.service';

export function createRevenueTools(revenueService: RevenueService) {
  const getRevenueOverview = tool(
    async ({ period }) => {
      const result = await revenueService.getRevenueOverview(period);
      return JSON.stringify(result);
    },
    {
      name: 'get_revenue_overview',
      description:
        'Get a summary of revenue including total ARR, new ARR, expansion, contraction, churn, and total closed ACV.',
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
        'Get monthly ARR waterfall movements: starting ARR, new business, expansion, schedule change, contraction, churn, and ending ARR.',
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
        'Get customer health data showing ARR and renewal risk for each customer. Returns up to 50 customers. Can filter by risk level.',
      schema: z.object({
        risk_level: z
          .string()
          .optional()
          .describe('Filter by risk: Low, Medium, High, Critical'),
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
        'Get customer cohort analysis grouped by contract start year, showing customer count and current ARR per cohort.',
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
        'Get churn analysis showing total churned customer count and churned ARR.',
      schema: z.object({}),
    },
  );

  const getRevenueData = tool(
    async () => {
      const data = revenueService.getRevenueData();
      // Return summary counts to avoid huge payload
      return JSON.stringify({
        arrSnapshots_count: data.arrSnapshots.length,
        pipelineSnapshots_count: data.pipelineSnapshots.length,
        closedAcv_count: data.closedAcv.length,
        sowMappings_count: data.sowMappings.length,
        message:
          'Use get_revenue_overview, get_arr_movement, get_customer_health, get_cohort_analysis, or get_churn_analysis for detailed analysis.',
      });
    },
    {
      name: 'get_revenue_data_summary',
      description:
        'Get a high-level summary of available revenue data counts. Use specific tools for detailed analysis.',
      schema: z.object({}),
    },
  );

  return [
    getRevenueOverview,
    getArrMovement,
    getCustomerHealth,
    getCohortAnalysis,
    getChurnAnalysis,
    getRevenueData,
  ];
}
