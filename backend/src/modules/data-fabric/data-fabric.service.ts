import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateDataSourceDto,
  UpdateDataSourceDto,
  CreateDataMappingDto,
  RunSyncDto,
  GetSyncHistoryDto,
  DataQualityCheckDto,
  QueryDataDto,
} from './dto';

interface DataSource {
  id: string;
  name: string;
  type: string;
  description: string;
  connection_config: Record<string, any>;
  sync_schedule: string;
  real_time_sync: boolean;
  is_active: boolean;
  status: string;
  last_sync: Date | null;
  created_at: Date;
  updated_at: Date;
  metadata: {
    entities: string[];
    record_count: number;
    schema_version: string;
  };
}

interface DataMapping {
  id: string;
  name: string;
  source_id: string;
  source_entity: string;
  target_entity: string;
  field_mappings: any[];
  transformations: any[];
  is_active: boolean;
  created_at: Date;
}

interface SyncJob {
  id: string;
  source_id: string;
  source_name: string;
  status: string;
  type: string;
  started_at: Date;
  completed_at: Date | null;
  records_processed: number;
  records_failed: number;
  error_message: string | null;
}

@Injectable()
export class DataFabricService {
  private dataSources: Map<string, DataSource> = new Map();
  private mappings: Map<string, DataMapping> = new Map();
  private syncHistory: SyncJob[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Initialize data sources
    const sources: DataSource[] = [
      {
        id: 'ds_001',
        name: 'Salesforce CRM',
        type: 'salesforce',
        description: 'Primary CRM system for sales pipeline data',
        connection_config: { instance_url: 'https://company.salesforce.com', api_version: '57.0' },
        sync_schedule: '0 */4 * * *',
        real_time_sync: true,
        is_active: true,
        status: 'connected',
        last_sync: new Date(Date.now() - 3600000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        metadata: {
          entities: ['Opportunity', 'Account', 'Contact', 'Lead'],
          record_count: 125000,
          schema_version: '2024.1',
        },
      },
      {
        id: 'ds_002',
        name: 'NetSuite ERP',
        type: 'netsuite',
        description: 'ERP system for financial and operational data',
        connection_config: { account_id: 'COMPANY_123', role: 'Administrator' },
        sync_schedule: '0 0 * * *',
        real_time_sync: false,
        is_active: true,
        status: 'connected',
        last_sync: new Date(Date.now() - 7200000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        metadata: {
          entities: ['Invoice', 'Customer', 'Vendor', 'Transaction', 'Budget'],
          record_count: 450000,
          schema_version: '2024.1',
        },
      },
      {
        id: 'ds_003',
        name: 'Workday HCM',
        type: 'workday',
        description: 'Human capital management system',
        connection_config: { tenant: 'company_impl', environment: 'production' },
        sync_schedule: '0 2 * * *',
        real_time_sync: false,
        is_active: true,
        status: 'connected',
        last_sync: new Date(Date.now() - 86400000),
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        metadata: {
          entities: ['Worker', 'Organization', 'Position', 'Compensation'],
          record_count: 5000,
          schema_version: '2024.1',
        },
      },
      {
        id: 'ds_004',
        name: 'Snowflake Data Warehouse',
        type: 'snowflake',
        description: 'Central data warehouse for analytics',
        connection_config: { account: 'company.us-east-1', warehouse: 'ANALYTICS_WH' },
        sync_schedule: '0 */1 * * *',
        real_time_sync: true,
        is_active: true,
        status: 'connected',
        last_sync: new Date(Date.now() - 1800000),
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
        metadata: {
          entities: ['SALES_FACT', 'CUSTOMER_DIM', 'PRODUCT_DIM', 'TIME_DIM'],
          record_count: 10000000,
          schema_version: '2024.2',
        },
      },
    ];
    sources.forEach(s => this.dataSources.set(s.id, s));

    // Initialize mappings
    const mappings: DataMapping[] = [
      {
        id: 'map_001',
        name: 'Salesforce Opportunities to Deals',
        source_id: 'ds_001',
        source_entity: 'Opportunity',
        target_entity: 'Deal',
        field_mappings: [
          { source_field: 'Id', target_field: 'external_id', data_type: 'string' },
          { source_field: 'Name', target_field: 'name', data_type: 'string' },
          { source_field: 'Amount', target_field: 'amount', data_type: 'number' },
          { source_field: 'CloseDate', target_field: 'close_date', data_type: 'date' },
          { source_field: 'StageName', target_field: 'stage', data_type: 'string', transform: 'mapStage' },
          { source_field: 'Probability', target_field: 'probability', data_type: 'number', transform: 'value / 100' },
        ],
        transformations: [
          { name: 'mapStage', type: 'lookup', config: { mapping: { 'Prospecting': 'lead', 'Qualification': 'qualified', 'Proposal': 'proposal', 'Negotiation': 'negotiation', 'Closed Won': 'closed_won', 'Closed Lost': 'closed_lost' } } },
        ],
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'map_002',
        name: 'NetSuite Invoices to Revenue',
        source_id: 'ds_002',
        source_entity: 'Invoice',
        target_entity: 'Revenue',
        field_mappings: [
          { source_field: 'internalId', target_field: 'external_id', data_type: 'string' },
          { source_field: 'tranDate', target_field: 'date', data_type: 'date' },
          { source_field: 'total', target_field: 'amount', data_type: 'number' },
          { source_field: 'currency.symbol', target_field: 'currency', data_type: 'string', default_value: 'USD' },
          { source_field: 'entity.name', target_field: 'customer_name', data_type: 'string' },
        ],
        transformations: [
          { name: 'currencyConvert', type: 'convert', config: { target_currency: 'USD', rate_source: 'daily' } },
        ],
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
    ];
    mappings.forEach(m => this.mappings.set(m.id, m));

    // Initialize sync history
    this.syncHistory = [
      {
        id: 'sync_001',
        source_id: 'ds_001',
        source_name: 'Salesforce CRM',
        status: 'completed',
        type: 'incremental',
        started_at: new Date(Date.now() - 3600000),
        completed_at: new Date(Date.now() - 3500000),
        records_processed: 1250,
        records_failed: 3,
        error_message: null,
      },
      {
        id: 'sync_002',
        source_id: 'ds_002',
        source_name: 'NetSuite ERP',
        status: 'completed',
        type: 'full',
        started_at: new Date(Date.now() - 86400000),
        completed_at: new Date(Date.now() - 82800000),
        records_processed: 45000,
        records_failed: 12,
        error_message: null,
      },
      {
        id: 'sync_003',
        source_id: 'ds_003',
        source_name: 'Workday HCM',
        status: 'failed',
        type: 'incremental',
        started_at: new Date(Date.now() - 172800000),
        completed_at: new Date(Date.now() - 172700000),
        records_processed: 0,
        records_failed: 0,
        error_message: 'Authentication token expired',
      },
    ];
  }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getDataSourceById(id: string): Promise<DataSource> {
    const source = this.dataSources.get(id);
    if (!source) {
      throw new NotFoundException(`Data source with ID ${id} not found`);
    }
    return source;
  }

  async createDataSource(dto: CreateDataSourceDto): Promise<DataSource> {
    const id = `ds_${Date.now()}`;

    const source: DataSource = {
      id,
      name: dto.name,
      type: dto.type,
      description: dto.description || '',
      connection_config: dto.connection_config,
      sync_schedule: dto.sync_schedule || '0 0 * * *',
      real_time_sync: dto.real_time_sync || false,
      is_active: true,
      status: 'pending',
      last_sync: null,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {
        entities: [],
        record_count: 0,
        schema_version: '',
      },
    };

    this.dataSources.set(id, source);
    return source;
  }

  async updateDataSource(id: string, dto: UpdateDataSourceDto): Promise<DataSource> {
    const source = await this.getDataSourceById(id);

    const updated: DataSource = {
      ...source,
      ...dto,
      updated_at: new Date(),
    };

    this.dataSources.set(id, updated);
    return updated;
  }

  async deleteDataSource(id: string): Promise<void> {
    const source = await this.getDataSourceById(id);
    this.dataSources.delete(id);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string; latency_ms: number }> {
    const source = await this.getDataSourceById(id);

    // Simulate connection test
    const latency = Math.floor(Math.random() * 200) + 50;
    const success = Math.random() > 0.1;

    if (success) {
      source.status = 'connected';
      this.dataSources.set(id, source);
    }

    return {
      success,
      message: success ? 'Connection successful' : 'Connection failed: Authentication error',
      latency_ms: latency,
    };
  }

  // Data Mappings
  async getDataMappings(sourceId?: string): Promise<DataMapping[]> {
    let mappings = Array.from(this.mappings.values());

    if (sourceId) {
      mappings = mappings.filter(m => m.source_id === sourceId);
    }

    return mappings;
  }

  async getMappingById(id: string): Promise<DataMapping> {
    const mapping = this.mappings.get(id);
    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }
    return mapping;
  }

  async createDataMapping(dto: CreateDataMappingDto): Promise<DataMapping> {
    // Validate source exists
    await this.getDataSourceById(dto.source_id);

    const id = `map_${Date.now()}`;

    const mapping: DataMapping = {
      id,
      name: dto.name,
      source_id: dto.source_id,
      source_entity: dto.source_entity,
      target_entity: dto.target_entity,
      field_mappings: dto.field_mappings,
      transformations: dto.transformations || [],
      is_active: true,
      created_at: new Date(),
    };

    this.mappings.set(id, mapping);
    return mapping;
  }

  async deleteDataMapping(id: string): Promise<void> {
    await this.getMappingById(id);
    this.mappings.delete(id);
  }

  // Sync Operations
  async runSync(dto: RunSyncDto): Promise<SyncJob> {
    const source = await this.getDataSourceById(dto.source_id);

    const job: SyncJob = {
      id: `sync_${Date.now()}`,
      source_id: dto.source_id,
      source_name: source.name,
      status: 'running',
      type: dto.full_sync ? 'full' : 'incremental',
      started_at: new Date(),
      completed_at: null,
      records_processed: 0,
      records_failed: 0,
      error_message: null,
    };

    this.syncHistory.unshift(job);

    // Simulate async completion
    setTimeout(() => {
      job.status = 'completed';
      job.completed_at = new Date();
      job.records_processed = Math.floor(Math.random() * 5000) + 100;
      job.records_failed = Math.floor(Math.random() * 10);

      source.last_sync = new Date();
      this.dataSources.set(source.id, source);
    }, 5000);

    return job;
  }

  async getSyncHistory(dto: GetSyncHistoryDto): Promise<{
    data: SyncJob[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    let jobs = [...this.syncHistory];

    if (dto.source_id) {
      jobs = jobs.filter(j => j.source_id === dto.source_id);
    }
    if (dto.status) {
      jobs = jobs.filter(j => j.status === dto.status);
    }

    const total = jobs.length;
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const start = (page - 1) * limit;
    const paginatedJobs = jobs.slice(start, start + limit);

    return {
      data: paginatedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getSyncJobById(id: string): Promise<SyncJob> {
    const job = this.syncHistory.find(j => j.id === id);
    if (!job) {
      throw new NotFoundException(`Sync job with ID ${id} not found`);
    }
    return job;
  }

  // Data Quality
  async runDataQualityCheck(dto: DataQualityCheckDto): Promise<{
    entity: string;
    checked_at: Date;
    total_records: number;
    quality_score: number;
    rules_passed: number;
    rules_failed: number;
    issues: any[];
  }> {
    const allRules = ['completeness', 'uniqueness', 'validity', 'consistency', 'accuracy', 'timeliness'];
    const rulesToRun = dto.rules || allRules;

    const issues: any[] = [];
    let passed = 0;
    let failed = 0;

    rulesToRun.forEach(rule => {
      const hasFailed = Math.random() > 0.7;
      if (hasFailed) {
        failed++;
        issues.push({
          rule,
          severity: Math.random() > 0.5 ? 'high' : 'medium',
          affected_records: Math.floor(Math.random() * 100),
          description: this.getQualityIssueDescription(rule),
          recommendation: this.getQualityRecommendation(rule),
        });
      } else {
        passed++;
      }
    });

    return {
      entity: dto.entity,
      checked_at: new Date(),
      total_records: Math.floor(Math.random() * 50000) + 10000,
      quality_score: Math.round((passed / rulesToRun.length) * 100),
      rules_passed: passed,
      rules_failed: failed,
      issues,
    };
  }

  private getQualityIssueDescription(rule: string): string {
    const descriptions = {
      completeness: 'Missing required fields detected in records',
      uniqueness: 'Duplicate records found based on key fields',
      validity: 'Invalid data format in some fields',
      consistency: 'Inconsistent values across related records',
      accuracy: 'Values outside expected ranges detected',
      timeliness: 'Stale data detected (>24 hours old)',
    };
    return descriptions[rule] || 'Data quality issue detected';
  }

  private getQualityRecommendation(rule: string): string {
    const recommendations = {
      completeness: 'Review source data mapping and add default values for required fields',
      uniqueness: 'Implement deduplication logic in ETL pipeline',
      validity: 'Add data validation rules at ingestion point',
      consistency: 'Review referential integrity constraints',
      accuracy: 'Validate business rules and data ranges',
      timeliness: 'Increase sync frequency or enable real-time sync',
    };
    return recommendations[rule] || 'Review and address the data quality issue';
  }

  // Data Query
  async queryData(dto: QueryDataDto): Promise<{
    query_type: string;
    execution_time_ms: number;
    row_count: number;
    columns: string[];
    data: any[];
  }> {
    // Simulate query execution
    const executionTime = Math.floor(Math.random() * 500) + 50;

    // Generate mock result based on query
    const mockData = this.generateMockQueryResult(dto);

    return {
      query_type: dto.query_type,
      execution_time_ms: executionTime,
      row_count: mockData.data.length,
      columns: mockData.columns,
      data: mockData.data,
    };
  }

  private generateMockQueryResult(dto: QueryDataDto): { columns: string[]; data: any[] } {
    // Default mock result
    const columns = ['id', 'name', 'amount', 'date', 'status'];
    const data = Array.from({ length: Math.min(dto.limit || 100, 10) }, (_, i) => ({
      id: `rec_${i + 1}`,
      name: `Record ${i + 1}`,
      amount: Math.floor(Math.random() * 100000),
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: ['active', 'pending', 'completed'][Math.floor(Math.random() * 3)],
    }));

    return { columns, data };
  }

  // Data Catalog
  async getDataCatalog(): Promise<{
    entities: any[];
    relationships: any[];
    total_records: number;
    last_updated: Date;
  }> {
    return {
      entities: [
        {
          name: 'Deal',
          description: 'Sales opportunities and deals',
          source: 'Salesforce CRM',
          record_count: 15000,
          fields: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique identifier' },
            { name: 'name', type: 'string', nullable: false, description: 'Deal name' },
            { name: 'amount', type: 'number', nullable: true, description: 'Deal value in USD' },
            { name: 'stage', type: 'string', nullable: false, description: 'Sales stage' },
            { name: 'close_date', type: 'date', nullable: true, description: 'Expected close date' },
            { name: 'probability', type: 'number', nullable: true, description: 'Win probability (0-1)' },
          ],
        },
        {
          name: 'Customer',
          description: 'Customer and account information',
          source: 'NetSuite ERP',
          record_count: 8500,
          fields: [
            { name: 'id', type: 'string', nullable: false, description: 'Unique identifier' },
            { name: 'name', type: 'string', nullable: false, description: 'Customer name' },
            { name: 'industry', type: 'string', nullable: true, description: 'Industry category' },
            { name: 'arr', type: 'number', nullable: true, description: 'Annual recurring revenue' },
            { name: 'health_score', type: 'number', nullable: true, description: 'Customer health (0-100)' },
          ],
        },
        {
          name: 'Revenue',
          description: 'Revenue transactions',
          source: 'NetSuite ERP',
          record_count: 125000,
          fields: [
            { name: 'id', type: 'string', nullable: false, description: 'Transaction ID' },
            { name: 'date', type: 'date', nullable: false, description: 'Transaction date' },
            { name: 'amount', type: 'number', nullable: false, description: 'Amount in USD' },
            { name: 'customer_id', type: 'string', nullable: false, description: 'Customer reference' },
            { name: 'type', type: 'string', nullable: false, description: 'Revenue type' },
          ],
        },
        {
          name: 'Cost',
          description: 'Cost and expense data',
          source: 'NetSuite ERP',
          record_count: 85000,
          fields: [
            { name: 'id', type: 'string', nullable: false, description: 'Transaction ID' },
            { name: 'date', type: 'date', nullable: false, description: 'Transaction date' },
            { name: 'amount', type: 'number', nullable: false, description: 'Amount in USD' },
            { name: 'category', type: 'string', nullable: false, description: 'Cost category' },
            { name: 'vendor_id', type: 'string', nullable: true, description: 'Vendor reference' },
          ],
        },
      ],
      relationships: [
        { from: 'Deal', to: 'Customer', type: 'many-to-one', field: 'customer_id' },
        { from: 'Revenue', to: 'Customer', type: 'many-to-one', field: 'customer_id' },
        { from: 'Cost', to: 'Vendor', type: 'many-to-one', field: 'vendor_id' },
      ],
      total_records: 233500,
      last_updated: new Date(),
    };
  }
}
