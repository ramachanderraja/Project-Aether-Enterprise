import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  CreateWebhookDto,
  GetWebhookLogsDto,
  CreateApiKeyDto,
  OAuthCallbackDto,
  TestIntegrationDto,
} from './dto';

interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  auth_config: Record<string, any>;
  webhook_url: string | null;
  scopes: string[];
  status: string;
  is_active: boolean;
  last_sync: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface Webhook {
  id: string;
  name: string;
  integration_id: string;
  events: string[];
  target_url: string | null;
  secret: string;
  is_active: boolean;
  created_at: Date;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  status: string;
  response_code: number | null;
  error_message: string | null;
  timestamp: Date;
}

interface ApiKey {
  id: string;
  name: string;
  description: string;
  key_prefix: string;
  key_hash: string;
  permissions: string[];
  rate_limit: number;
  expires_at: Date | null;
  last_used: Date | null;
  is_active: boolean;
  created_at: Date;
}

@Injectable()
export class IntegrationsService {
  private integrations: Map<string, Integration> = new Map();
  private webhooks: Map<string, Webhook> = new Map();
  private webhookLogs: WebhookLog[] = [];
  private apiKeys: Map<string, ApiKey> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Initialize integrations
    const integrations: Integration[] = [
      {
        id: 'int_001',
        name: 'Salesforce Production',
        type: 'salesforce',
        description: 'Main Salesforce CRM integration',
        auth_config: { auth_type: 'oauth2', instance_url: 'https://company.salesforce.com' },
        webhook_url: 'https://api.aether.com/webhooks/salesforce/int_001',
        scopes: ['api', 'refresh_token', 'offline_access'],
        status: 'connected',
        is_active: true,
        last_sync: new Date(Date.now() - 3600000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
      },
      {
        id: 'int_002',
        name: 'NetSuite Finance',
        type: 'netsuite',
        description: 'NetSuite ERP for financial data',
        auth_config: { auth_type: 'token', account_id: 'COMPANY_123' },
        webhook_url: null,
        scopes: ['restlets', 'rest_webservices'],
        status: 'connected',
        is_active: true,
        last_sync: new Date(Date.now() - 7200000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
      },
      {
        id: 'int_003',
        name: 'Slack Notifications',
        type: 'slack',
        description: 'Slack integration for alerts and notifications',
        auth_config: { auth_type: 'oauth2', team_id: 'T123456' },
        webhook_url: 'https://api.aether.com/webhooks/slack/int_003',
        scopes: ['chat:write', 'channels:read', 'users:read'],
        status: 'connected',
        is_active: true,
        last_sync: null,
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
      },
      {
        id: 'int_004',
        name: 'HubSpot Marketing',
        type: 'hubspot',
        description: 'HubSpot integration for marketing data',
        auth_config: { auth_type: 'oauth2', portal_id: '12345678' },
        webhook_url: 'https://api.aether.com/webhooks/hubspot/int_004',
        scopes: ['contacts', 'deals', 'analytics.read'],
        status: 'error',
        is_active: true,
        last_sync: new Date(Date.now() - 86400000 * 3),
        created_at: new Date('2024-02-01'),
        updated_at: new Date(),
      },
    ];
    integrations.forEach(i => this.integrations.set(i.id, i));

    // Initialize webhooks
    const webhooks: Webhook[] = [
      {
        id: 'wh_001',
        name: 'Opportunity Updates',
        integration_id: 'int_001',
        events: ['opportunity.created', 'opportunity.updated', 'opportunity.closed'],
        target_url: null,
        secret: 'whsec_' + randomBytes(16).toString('hex'),
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'wh_002',
        name: 'Invoice Events',
        integration_id: 'int_002',
        events: ['invoice.created', 'invoice.paid', 'invoice.overdue'],
        target_url: null,
        secret: 'whsec_' + randomBytes(16).toString('hex'),
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'wh_003',
        name: 'Alert Notifications',
        integration_id: 'int_003',
        events: ['anomaly.detected', 'threshold.breached', 'approval.required'],
        target_url: 'https://hooks.slack.com/services/T123/B456/xyz',
        secret: 'whsec_' + randomBytes(16).toString('hex'),
        is_active: true,
        created_at: new Date('2024-01-15'),
      },
    ];
    webhooks.forEach(w => this.webhooks.set(w.id, w));

    // Initialize webhook logs
    this.webhookLogs = [
      {
        id: 'log_001',
        webhook_id: 'wh_001',
        event: 'opportunity.updated',
        payload: { opportunity_id: 'opp_123', amount: 50000, stage: 'negotiation' },
        status: 'success',
        response_code: 200,
        error_message: null,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 'log_002',
        webhook_id: 'wh_003',
        event: 'anomaly.detected',
        payload: { type: 'revenue_spike', value: 250000, threshold: 200000 },
        status: 'success',
        response_code: 200,
        error_message: null,
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        id: 'log_003',
        webhook_id: 'wh_002',
        event: 'invoice.paid',
        payload: { invoice_id: 'inv_456', amount: 15000 },
        status: 'failed',
        response_code: 500,
        error_message: 'Internal server error',
        timestamp: new Date(Date.now() - 86400000),
      },
    ];

    // Initialize API keys
    const apiKeys: ApiKey[] = [
      {
        id: 'key_001',
        name: 'Dashboard API Key',
        description: 'API key for dashboard widgets',
        key_prefix: 'ak_live_abc',
        key_hash: 'hashed_key_value',
        permissions: ['read:dashboard', 'read:kpis', 'read:deals'],
        rate_limit: 100,
        expires_at: null,
        last_used: new Date(Date.now() - 3600000),
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'key_002',
        name: 'Mobile App Key',
        description: 'API key for mobile application',
        key_prefix: 'ak_live_def',
        key_hash: 'hashed_key_value_2',
        permissions: ['read:dashboard', 'read:notifications'],
        rate_limit: 60,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        last_used: new Date(Date.now() - 86400000),
        is_active: true,
        created_at: new Date('2024-02-01'),
      },
    ];
    apiKeys.forEach(k => this.apiKeys.set(k.id, k));
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  async getIntegrationById(id: string): Promise<Integration> {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }
    return integration;
  }

  async createIntegration(dto: CreateIntegrationDto): Promise<Integration> {
    const id = `int_${Date.now()}`;

    const integration: Integration = {
      id,
      name: dto.name,
      type: dto.type,
      description: dto.description || '',
      auth_config: dto.auth_config,
      webhook_url: dto.webhook_url || `https://api.aether.com/webhooks/${dto.type}/${id}`,
      scopes: dto.scopes || [],
      status: 'pending',
      is_active: true,
      last_sync: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, dto: UpdateIntegrationDto): Promise<Integration> {
    const integration = await this.getIntegrationById(id);

    const updated: Integration = {
      ...integration,
      ...dto,
      updated_at: new Date(),
    };

    this.integrations.set(id, updated);
    return updated;
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.getIntegrationById(id);
    this.integrations.delete(id);

    // Delete associated webhooks
    this.webhooks.forEach((webhook, key) => {
      if (webhook.integration_id === id) {
        this.webhooks.delete(key);
      }
    });
  }

  async testIntegration(dto: TestIntegrationDto): Promise<{
    integration_id: string;
    tests: { name: string; status: string; message: string; latency_ms: number }[];
    overall_status: string;
  }> {
    const integration = await this.getIntegrationById(dto.integration_id);
    const testType = dto.test_type || 'all';

    const tests: { name: string; status: string; message: string; latency_ms: number }[] = [];

    if (testType === 'all' || testType === 'auth') {
      tests.push({
        name: 'Authentication',
        status: 'passed',
        message: 'Successfully authenticated with credentials',
        latency_ms: Math.floor(Math.random() * 200) + 50,
      });
    }

    if (testType === 'all' || testType === 'connectivity') {
      tests.push({
        name: 'Connectivity',
        status: 'passed',
        message: `Connection to ${integration.type} API successful`,
        latency_ms: Math.floor(Math.random() * 150) + 30,
      });
    }

    if (testType === 'all' || testType === 'permissions') {
      const permissionPassed = Math.random() > 0.2;
      tests.push({
        name: 'Permissions',
        status: permissionPassed ? 'passed' : 'warning',
        message: permissionPassed
          ? 'All required scopes are available'
          : 'Some optional scopes are missing',
        latency_ms: Math.floor(Math.random() * 100) + 20,
      });
    }

    const overallStatus = tests.every(t => t.status === 'passed')
      ? 'passed'
      : tests.some(t => t.status === 'failed')
        ? 'failed'
        : 'warning';

    // Update integration status
    integration.status = overallStatus === 'passed' ? 'connected' : 'error';
    this.integrations.set(dto.integration_id, integration);

    return {
      integration_id: dto.integration_id,
      tests,
      overall_status: overallStatus,
    };
  }

  async getOAuthUrl(integrationId: string): Promise<{ url: string; state: string }> {
    const integration = await this.getIntegrationById(integrationId);
    const state = randomBytes(16).toString('hex');

    const oauthUrls: Record<string, string> = {
      salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
      hubspot: 'https://app.hubspot.com/oauth/authorize',
      slack: 'https://slack.com/oauth/v2/authorize',
    };

    const baseUrl = oauthUrls[integration.type] || 'https://example.com/oauth/authorize';

    return {
      url: `${baseUrl}?client_id=YOUR_CLIENT_ID&redirect_uri=https://api.aether.com/oauth/callback&state=${state}&scope=${integration.scopes.join('%20')}`,
      state,
    };
  }

  async handleOAuthCallback(dto: OAuthCallbackDto): Promise<{ success: boolean; integration_id: string }> {
    // In a real implementation, this would exchange the code for tokens
    return {
      success: true,
      integration_id: 'int_001', // Would be determined from state
    };
  }

  // Webhooks
  async getWebhooks(integrationId?: string): Promise<Webhook[]> {
    let webhooks = Array.from(this.webhooks.values());

    if (integrationId) {
      webhooks = webhooks.filter(w => w.integration_id === integrationId);
    }

    return webhooks;
  }

  async getWebhookById(id: string): Promise<Webhook> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }
    return webhook;
  }

  async createWebhook(dto: CreateWebhookDto): Promise<Webhook & { webhook_url: string }> {
    await this.getIntegrationById(dto.integration_id);

    const id = `wh_${Date.now()}`;
    const secret = dto.secret || 'whsec_' + randomBytes(16).toString('hex');

    const webhook: Webhook = {
      id,
      name: dto.name,
      integration_id: dto.integration_id,
      events: dto.events,
      target_url: dto.target_url || null,
      secret,
      is_active: true,
      created_at: new Date(),
    };

    this.webhooks.set(id, webhook);

    return {
      ...webhook,
      webhook_url: `https://api.aether.com/webhooks/receive/${id}`,
    };
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.getWebhookById(id);
    this.webhooks.delete(id);
  }

  async getWebhookLogs(dto: GetWebhookLogsDto): Promise<{
    data: WebhookLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    let logs = [...this.webhookLogs];

    if (dto.webhook_id) {
      logs = logs.filter(l => l.webhook_id === dto.webhook_id);
    }
    if (dto.status) {
      logs = logs.filter(l => l.status === dto.status);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = logs.length;
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const start = (page - 1) * limit;
    const paginatedLogs = logs.slice(start, start + limit);

    return {
      data: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async receiveWebhook(webhookId: string, payload: any): Promise<{ received: boolean; log_id: string }> {
    const webhook = await this.getWebhookById(webhookId);

    const log: WebhookLog = {
      id: `log_${Date.now()}`,
      webhook_id: webhookId,
      event: payload.event || 'unknown',
      payload,
      status: 'success',
      response_code: 200,
      error_message: null,
      timestamp: new Date(),
    };

    this.webhookLogs.unshift(log);

    return {
      received: true,
      log_id: log.id,
    };
  }

  // API Keys
  async getApiKeys(): Promise<Omit<ApiKey, 'key_hash'>[]> {
    return Array.from(this.apiKeys.values()).map(({ key_hash, ...rest }) => rest);
  }

  async createApiKey(dto: CreateApiKeyDto): Promise<{ api_key: ApiKey; secret_key: string }> {
    const id = `key_${Date.now()}`;
    const secretKey = `ak_live_${randomBytes(24).toString('hex')}`;
    const keyPrefix = secretKey.substring(0, 12);

    const apiKey: ApiKey = {
      id,
      name: dto.name,
      description: dto.description || '',
      key_prefix: keyPrefix,
      key_hash: 'hashed_' + secretKey, // In production, use proper hashing
      permissions: dto.permissions,
      rate_limit: dto.rate_limit || 60,
      expires_at: dto.expires_in_days
        ? new Date(Date.now() + dto.expires_in_days * 24 * 60 * 60 * 1000)
        : null,
      last_used: null,
      is_active: true,
      created_at: new Date(),
    };

    this.apiKeys.set(id, apiKey);

    return {
      api_key: apiKey,
      secret_key: secretKey, // Only shown once!
    };
  }

  async revokeApiKey(id: string): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    apiKey.is_active = false;
    this.apiKeys.set(id, apiKey);
  }

  // Available Integrations Catalog
  async getAvailableIntegrations(): Promise<any[]> {
    return [
      {
        type: 'salesforce',
        name: 'Salesforce',
        category: 'crm',
        description: 'Connect to Salesforce CRM for sales pipeline and opportunity data',
        auth_type: 'oauth2',
        logo_url: '/integrations/salesforce.svg',
        features: ['Real-time sync', 'Bidirectional data flow', 'Custom objects'],
      },
      {
        type: 'hubspot',
        name: 'HubSpot',
        category: 'crm',
        description: 'Integrate with HubSpot for marketing and sales data',
        auth_type: 'oauth2',
        logo_url: '/integrations/hubspot.svg',
        features: ['Contact sync', 'Deal tracking', 'Marketing analytics'],
      },
      {
        type: 'netsuite',
        name: 'NetSuite',
        category: 'erp',
        description: 'Connect to NetSuite ERP for financial and operational data',
        auth_type: 'token',
        logo_url: '/integrations/netsuite.svg',
        features: ['Financial data', 'Inventory management', 'Custom scripts'],
      },
      {
        type: 'sap',
        name: 'SAP',
        category: 'erp',
        description: 'Integration with SAP ERP systems',
        auth_type: 'basic',
        logo_url: '/integrations/sap.svg',
        features: ['Financial posting', 'Material management', 'Cost centers'],
      },
      {
        type: 'workday',
        name: 'Workday',
        category: 'hcm',
        description: 'Human capital management data from Workday',
        auth_type: 'oauth2',
        logo_url: '/integrations/workday.svg',
        features: ['Employee data', 'Compensation', 'Headcount planning'],
      },
      {
        type: 'slack',
        name: 'Slack',
        category: 'collaboration',
        description: 'Send notifications and alerts to Slack channels',
        auth_type: 'oauth2',
        logo_url: '/integrations/slack.svg',
        features: ['Alert notifications', 'Approval workflows', 'AI assistant'],
      },
      {
        type: 'teams',
        name: 'Microsoft Teams',
        category: 'collaboration',
        description: 'Integration with Microsoft Teams for notifications',
        auth_type: 'oauth2',
        logo_url: '/integrations/teams.svg',
        features: ['Channel notifications', 'Cards', 'Bot integration'],
      },
      {
        type: 'jira',
        name: 'Jira',
        category: 'project_management',
        description: 'Connect to Jira for project and task tracking',
        auth_type: 'oauth2',
        logo_url: '/integrations/jira.svg',
        features: ['Issue tracking', 'Sprint data', 'Velocity metrics'],
      },
    ];
  }
}
