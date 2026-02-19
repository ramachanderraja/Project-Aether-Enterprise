import { Injectable, NotFoundException } from '@nestjs/common';
import { GetDealsDto, CreateDealDto, UpdateDealDto } from '../dto';

@Injectable()
export class DealService {

  async getDeals(query: GetDealsDto) {
    const { stage, owner_id, region, risk_level, page = 1, limit = 20 } = query;

    // Sample deals data - in production, query from database
    const sampleDeals = [
      {
        id: 'deal_001',
        name: 'Acme Corp Enterprise License',
        account: {
          id: 'acc_001',
          name: 'Acme Corporation',
          industry: 'Technology',
          size: 'Enterprise',
        },
        owner: {
          id: 'usr_sales01',
          name: 'Sarah Sales',
          email: 'sarah@company.com',
        },
        amount: 450000,
        currency: 'USD',
        stage: 'Negotiation',
        probability: 0.75,
        weighted_amount: 337500,
        close_date: '2026-03-15',
        created_date: '2025-11-20',
        days_in_pipeline: 72,
        days_in_stage: 8,
        last_activity_date: '2026-01-29',
        next_step: 'Final contract review with legal',
        risk_level: 'low',
        risk_factors: [],
        ai_insights: {
          win_probability: 0.82,
          confidence: 0.89,
          key_factors: [
            'Strong executive sponsorship',
            'Successful POC completion',
            'Budget confirmed',
          ],
          recommendations: [
            'Schedule final demo with CFO',
            'Address security questionnaire items',
          ],
        },
        products: [
          { id: 'prod_001', name: 'Core Platform', amount: 350000 },
          { id: 'prod_002', name: 'Analytics Add-on', amount: 100000 },
        ],
      },
      {
        id: 'deal_002',
        name: 'TechStart Inc Platform',
        account: {
          id: 'acc_002',
          name: 'TechStart Inc',
          industry: 'SaaS',
          size: 'Mid-Market',
        },
        owner: {
          id: 'usr_sales02',
          name: 'John Closer',
          email: 'john@company.com',
        },
        amount: 180000,
        currency: 'USD',
        stage: 'Proposal',
        probability: 0.50,
        weighted_amount: 90000,
        close_date: '2026-02-28',
        created_date: '2025-12-15',
        days_in_pipeline: 47,
        days_in_stage: 14,
        last_activity_date: '2026-01-28',
        next_step: 'Present updated proposal',
        risk_level: 'medium',
        risk_factors: ['Competitor involved', 'Budget constraints'],
        ai_insights: {
          win_probability: 0.45,
          confidence: 0.75,
          key_factors: [
            'Strong product fit',
            'Champion engaged',
          ],
          recommendations: [
            'Offer flexible payment terms',
            'Highlight competitive differentiators',
          ],
        },
        products: [
          { id: 'prod_001', name: 'Core Platform', amount: 150000 },
          { id: 'prod_003', name: 'Support Package', amount: 30000 },
        ],
      },
      {
        id: 'deal_003',
        name: 'Global Industries Expansion',
        account: {
          id: 'acc_003',
          name: 'Global Industries',
          industry: 'Manufacturing',
          size: 'Enterprise',
        },
        owner: {
          id: 'usr_sales01',
          name: 'Sarah Sales',
          email: 'sarah@company.com',
        },
        amount: 520000,
        currency: 'USD',
        stage: 'Qualification',
        probability: 0.25,
        weighted_amount: 130000,
        close_date: '2026-04-30',
        created_date: '2026-01-10',
        days_in_pipeline: 21,
        days_in_stage: 21,
        last_activity_date: '2026-01-30',
        next_step: 'Discovery call with VP Operations',
        risk_level: 'high',
        risk_factors: ['Long sales cycle expected', 'Multiple stakeholders', 'Complex procurement'],
        ai_insights: {
          win_probability: 0.30,
          confidence: 0.60,
          key_factors: [
            'Large expansion opportunity',
            'Existing relationship',
          ],
          recommendations: [
            'Map all stakeholders',
            'Prepare executive business review',
            'Consider phased implementation',
          ],
        },
        products: [
          { id: 'prod_001', name: 'Core Platform', amount: 400000 },
          { id: 'prod_002', name: 'Analytics Add-on', amount: 80000 },
          { id: 'prod_004', name: 'Integration Services', amount: 40000 },
        ],
      },
    ];

    // Filter deals
    let filtered = sampleDeals;
    if (stage) filtered = filtered.filter((d) => d.stage.toLowerCase() === stage.toLowerCase());
    if (owner_id) filtered = filtered.filter((d) => d.owner.id === owner_id);
    if (region) filtered = filtered.filter((d) => d.account.industry === region);
    if (risk_level) filtered = filtered.filter((d) => d.risk_level === risk_level);

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_previous: page > 1,
      },
    };
  }

  async getDealById(dealId: string) {
    const deals = await this.getDeals({ limit: 100 });
    const deal = deals.data.find((d: any) => d.id === dealId);

    if (!deal) {
      throw new NotFoundException(`Deal ${dealId} not found`);
    }

    // Add additional details for single deal view
    return {
      ...deal,
      stage_history: [
        { stage: 'Prospecting', entered_at: '2025-11-20', duration_days: 15 },
        { stage: 'Qualification', entered_at: '2025-12-05', duration_days: 22 },
        { stage: 'Proposal', entered_at: '2025-12-27', duration_days: 27 },
        { stage: 'Negotiation', entered_at: '2026-01-23', duration_days: 8 },
      ],
      contacts: [
        { id: 'con_001', name: 'John Executive', title: 'CFO', role: 'Economic Buyer' },
        { id: 'con_002', name: 'Jane Manager', title: 'VP Finance', role: 'Champion' },
      ],
      activities: [
        { id: 'act_001', type: 'meeting', subject: 'Contract Review Call', date: '2026-01-29' },
        { id: 'act_002', type: 'email', subject: 'Proposal Follow-up', date: '2026-01-28' },
      ],
    };
  }

  async createDeal(createDto: CreateDealDto) {
    const dealId = `deal_${Date.now()}`;

    return {
      id: dealId,
      ...createDto,
      created_at: new Date().toISOString(),
      stage: 'Prospecting',
      probability: 0.10,
    };
  }

  async updateDeal(dealId: string, updateDto: UpdateDealDto) {
    const deal = await this.getDealById(dealId);

    return {
      ...deal,
      ...updateDto,
      updated_at: new Date().toISOString(),
    };
  }

  async getAtRiskDeals() {
    const deals = await this.getDeals({ limit: 100 });
    const atRisk = deals.data.filter((d: any) => d.risk_level === 'high' || d.risk_level === 'medium');

    return {
      count: atRisk.length,
      total_value: atRisk.reduce((sum: number, d: any) => sum + d.amount, 0),
      deals: atRisk,
    };
  }
}
