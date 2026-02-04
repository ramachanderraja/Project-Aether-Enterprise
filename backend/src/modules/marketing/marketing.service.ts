import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketingService {
  async getMarketingOverview() {
    // Mock data - replace with actual database queries
    return {
      totalLeads: 2847,
      totalMQLs: 1423,
      totalSQLs: 712,
      totalOpportunities: 356,
      totalCustomers: 89,
      conversionRate: 3.12,
      averageCAC: 12500,
      marketingROI: 4.2,
      trends: {
        leads: { value: 2847, change: 12.5 },
        mqls: { value: 1423, change: 8.3 },
        sqls: { value: 712, change: 15.2 },
        customers: { value: 89, change: 22.1 },
      },
    };
  }

  async getMarketingFunnel() {
    return {
      stages: [
        { stage: 'Leads', count: 2847, conversionRate: 100 },
        { stage: 'MQLs', count: 1423, conversionRate: 50.0 },
        { stage: 'SQLs', count: 712, conversionRate: 50.0 },
        { stage: 'Opportunities', count: 356, conversionRate: 50.0 },
        { stage: 'Customers', count: 89, conversionRate: 25.0 },
      ],
      overallConversion: 3.12,
    };
  }

  async getChannelPerformance() {
    return {
      channels: [
        {
          channel: 'Organic Search',
          leads: 892,
          conversionRate: 4.2,
          cac: 8500,
          revenueGenerated: 2450000,
          roi: 6.8,
        },
        {
          channel: 'Paid Search',
          leads: 634,
          conversionRate: 3.8,
          cac: 15200,
          revenueGenerated: 1890000,
          roi: 3.2,
        },
        {
          channel: 'Social Media',
          leads: 456,
          conversionRate: 2.1,
          cac: 12800,
          revenueGenerated: 980000,
          roi: 2.4,
        },
        {
          channel: 'Events',
          leads: 423,
          conversionRate: 5.6,
          cac: 25000,
          revenueGenerated: 2100000,
          roi: 4.1,
        },
        {
          channel: 'Referrals',
          leads: 289,
          conversionRate: 8.2,
          cac: 5200,
          revenueGenerated: 1560000,
          roi: 9.2,
        },
        {
          channel: 'Content Marketing',
          leads: 153,
          conversionRate: 3.5,
          cac: 9800,
          revenueGenerated: 720000,
          roi: 3.8,
        },
      ],
    };
  }

  async getCampaigns(status?: string) {
    const campaigns = [
      {
        id: 'camp-001',
        name: 'Q1 Product Launch',
        status: 'active',
        budget: 150000,
        spent: 98500,
        leads: 456,
        conversions: 23,
        roi: 3.8,
        startDate: '2025-01-15',
        endDate: '2025-03-31',
      },
      {
        id: 'camp-002',
        name: 'Enterprise ABM Campaign',
        status: 'active',
        budget: 200000,
        spent: 145000,
        leads: 89,
        conversions: 12,
        roi: 5.2,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      },
      {
        id: 'camp-003',
        name: 'Tech Conference Sponsorship',
        status: 'completed',
        budget: 75000,
        spent: 75000,
        leads: 234,
        conversions: 18,
        roi: 4.1,
        startDate: '2024-11-01',
        endDate: '2024-12-15',
      },
      {
        id: 'camp-004',
        name: 'Content Syndication',
        status: 'active',
        budget: 50000,
        spent: 32000,
        leads: 312,
        conversions: 8,
        roi: 2.4,
        startDate: '2025-02-01',
        endDate: '2025-04-30',
      },
    ];

    if (status) {
      return { campaigns: campaigns.filter(c => c.status === status) };
    }
    return { campaigns };
  }

  async getLeadTrends(period?: string) {
    return {
      period: period || '12months',
      data: [
        { month: 'Feb 2024', leads: 198, mqls: 89, sqls: 42 },
        { month: 'Mar 2024', leads: 234, mqls: 112, sqls: 56 },
        { month: 'Apr 2024', leads: 212, mqls: 98, sqls: 48 },
        { month: 'May 2024', leads: 256, mqls: 134, sqls: 67 },
        { month: 'Jun 2024', leads: 289, mqls: 145, sqls: 72 },
        { month: 'Jul 2024', leads: 245, mqls: 118, sqls: 59 },
        { month: 'Aug 2024', leads: 278, mqls: 142, sqls: 71 },
        { month: 'Sep 2024', leads: 312, mqls: 156, sqls: 78 },
        { month: 'Oct 2024', leads: 298, mqls: 149, sqls: 74 },
        { month: 'Nov 2024', leads: 267, mqls: 128, sqls: 64 },
        { month: 'Dec 2024', leads: 223, mqls: 106, sqls: 53 },
        { month: 'Jan 2025', leads: 335, mqls: 168, sqls: 84 },
      ],
    };
  }

  async getAcquisitionMetrics() {
    return {
      totalCAC: 12500,
      cacByChannel: [
        { channel: 'Organic', cac: 8500 },
        { channel: 'Paid', cac: 15200 },
        { channel: 'Social', cac: 12800 },
        { channel: 'Events', cac: 25000 },
        { channel: 'Referrals', cac: 5200 },
      ],
      cacTrend: [
        { month: 'Oct 2024', cac: 14200 },
        { month: 'Nov 2024', cac: 13800 },
        { month: 'Dec 2024', cac: 13100 },
        { month: 'Jan 2025', cac: 12500 },
      ],
      ltv: 156000,
      ltvCacRatio: 12.5,
    };
  }
}
