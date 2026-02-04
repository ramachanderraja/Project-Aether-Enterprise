// Common API types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Dashboard types
export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target: number;
  unit: string;
  trend: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  value: number;
  threshold: number;
  detectedAt: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
}

export interface DashboardData {
  kpis: KPI[];
  anomalies: Anomaly[];
  cashFlowForecast: {
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }[];
  aiInsight: string;
}

// Sales types
export interface Deal {
  id: string;
  name: string;
  accountName: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  name: string;
  value: number;
  count: number;
  winRate: number;
}

export interface SalesForecast {
  period: string;
  committed: number;
  bestCase: number;
  worstCase: number;
  target: number;
}

// Cost types
export interface CostCategory {
  name: string;
  amount: number;
  budget: number;
  trend: number;
  subcategories: {
    name: string;
    amount: number;
  }[];
}

export interface VendorSpend {
  id: string;
  name: string;
  amount: number;
  contracts: number;
  savings: number;
}

export interface CostOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  status: 'identified' | 'in_progress' | 'implemented';
}

// Revenue types
export interface RevenueSegment {
  name: string;
  current: number;
  previous: number;
  target: number;
}

export interface ARRMovement {
  startingARR: number;
  newBusiness: number;
  expansion: number;
  contraction: number;
  churn: number;
  endingARR: number;
}

export interface Customer {
  id: string;
  name: string;
  arr: number;
  healthScore: number;
  lastContact: string;
  risk: 'low' | 'medium' | 'high';
  expansion: number;
}

// Scenario types
export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'budget' | 'forecast' | 'what_if' | 'sensitivity';
  status: 'draft' | 'active' | 'approved' | 'archived';
  assumptions: Assumption[];
  timeHorizon: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  results?: ScenarioResults;
}

export interface Assumption {
  variable: string;
  baseValue: number;
  minValue?: number;
  maxValue?: number;
  unit: string;
  category: string;
}

export interface ScenarioResults {
  revenue: number;
  costs: number;
  ebitda: number;
  margin: number;
}

export interface SimulationResult {
  scenarioId: string;
  iterations: number;
  results: {
    meanRevenue: number;
    meanCosts: number;
    meanEbitda: number;
    stdRevenue: number;
    stdEbitda: number;
  };
  confidenceIntervals: {
    revenue: { lower: number; upper: number; confidence: number };
    ebitda: { lower: number; upper: number; confidence: number };
  };
  distribution: { bucket: string; count: number; percentage: number }[];
}

// Governance types
export interface AuditLog {
  id: string;
  timestamp: string;
  actorType: 'user' | 'system' | 'ai';
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  changes?: Record<string, { from: any; to: any }>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  dataScope: Record<string, any>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: string;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  resourceType: string;
  resourceId: string;
  requesterId: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  currentStep: number;
  approvals: ApprovalStep[];
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  step: number;
  stepName: string;
  approverId: string;
  decision: string;
  comments: string;
  timestamp: string;
}

// Data Fabric types
export interface DataSource {
  id: string;
  name: string;
  type: string;
  description: string;
  connectionConfig: Record<string, any>;
  syncSchedule: string;
  realTimeSync: boolean;
  isActive: boolean;
  status: 'connected' | 'error' | 'syncing' | 'pending';
  lastSync: string | null;
  createdAt: string;
  metadata: {
    entities: string[];
    recordCount: number;
    schemaVersion: string;
  };
}

export interface DataMapping {
  id: string;
  name: string;
  sourceId: string;
  sourceEntity: string;
  targetEntity: string;
  fieldMappings: FieldMapping[];
  transformations: TransformationRule[];
  isActive: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: string;
  defaultValue?: any;
  transform?: string;
}

export interface TransformationRule {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface SyncJob {
  id: string;
  sourceId: string;
  sourceName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'full' | 'incremental';
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage: string | null;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  authConfig: Record<string, any>;
  webhookUrl: string | null;
  scopes: string[];
  status: 'connected' | 'error' | 'pending' | 'disconnected';
  isActive: boolean;
  lastSync: string | null;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  integrationId: string;
  events: string[];
  targetUrl: string | null;
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  description: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt: string | null;
  lastUsed: string | null;
  isActive: boolean;
  createdAt: string;
}

// AI types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AISuggestion {
  id: string;
  text: string;
  category: string;
}

// ============================================
// GTM (Go-To-Market) Types
// ============================================

export interface GTMMetric {
  id: string;
  metric: string;
  value: number;
  previousValue: number;
  trend: number;
  unit: string;
  category: 'acquisition' | 'retention' | 'efficiency' | 'growth';
  benchmark?: number;
  target?: number;
}

export interface UnitEconomics {
  cac: number;
  cacPaybackMonths: number;
  ltv: number;
  ltvCacRatio: number;
  grossMargin: number;
  netRevenueRetention: number;
  magicNumber: number;
  ruleOf40: number;
}

// ============================================
// Marketing Types
// ============================================

export interface AcquisitionChannel {
  id: string;
  channel: string;
  leads: number;
  mqls: number;
  sqls: number;
  opportunities: number;
  customers: number;
  conversionRate: number;
  cac: number;
  spend: number;
  revenueGenerated: number;
  roi: number;
  trend: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  startDate: string;
  endDate: string;
}

export interface LeadSource {
  source: string;
  count: number;
  percentage: number;
  trend: number;
  quality: 'high' | 'medium' | 'low';
}

export interface MarketingFunnel {
  stage: string;
  count: number;
  conversionRate: number;
  avgTimeInStage: number;
  dropoffRate: number;
}

// ============================================
// Reports / Profitability Types
// ============================================

export type Region = 'North America' | 'Europe' | 'Middle East' | 'Asia Pacific' | 'Latin America';
export type Vertical = 'CPG' | 'AIM' | 'TMT' | 'E&U' | 'LS' | 'Others';
export type LOB = 'Software' | 'Services';
export type Segment = 'Enterprise' | 'Mid-Market' | 'SMB';
export type RevenueType = 'License' | 'Implementation' | 'Subscription' | 'Maintenance';

export interface AccountProfitability {
  id: string;
  accountName: string;
  region: Region;
  segment: Segment;
  vertical: Vertical;
  lob: LOB;
  revenueType: RevenueType;
  revenue: number;
  directCosts: number;
  indirectCosts: number;
  grossMargin: number;
  grossMarginPct: number;
  contributionMargin: number;
  contributionMarginPct: number;
  healthScore: number;
  renewalDate: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ProfitabilityByDimension {
  dimension: string;
  revenue: number;
  costs: number;
  grossMargin: number;
  grossMarginPct: number;
  contributionMargin: number;
  contributionMarginPct: number;
  accountCount: number;
}

export interface MarginTrend {
  period: string;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  grossMarginPct: number;
  netMarginPct: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
  subcategories?: CostBreakdown[];
}

// ============================================
// Intelligent Core / ML Ops Types
// ============================================

export interface MLModel {
  id: string;
  name: string;
  displayName: string;
  version: string;
  type: 'forecasting' | 'classification' | 'anomaly_detection' | 'recommendation' | 'nlp';
  status: 'active' | 'training' | 'failed' | 'deprecated' | 'pending';
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  biasScore: number;
  driftScore: number;
  driftDetected: boolean;
  lastTrained: string;
  lastInference: string;
  inferenceCount: number;
  avgLatencyMs: number;
  inputFeatures: string[];
  outputType: string;
  trainingDataSize: number;
  modelSize: string;
  framework: string;
  deployedBy: string;
  createdAt: string;
}

export interface ModelMetrics {
  modelId: string;
  timestamp: string;
  accuracy: number;
  latencyMs: number;
  throughput: number;
  errorRate: number;
  driftScore: number;
}

export interface TrainingJob {
  id: string;
  modelId: string;
  modelName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  triggeredBy: 'manual' | 'scheduled' | 'drift_detected' | 'data_update';
  config: Record<string, any>;
  metrics?: {
    trainingLoss: number;
    validationLoss: number;
    accuracy: number;
  };
  errorMessage?: string;
}

export interface AutonomousDecision {
  id: string;
  timestamp: string;
  type: 'scaling' | 'retraining' | 'alert' | 'optimization' | 'data_quality';
  action: string;
  detail: string;
  status: 'success' | 'warning' | 'failed' | 'pending';
  impact: string;
  confidence: number;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ComputeResources {
  gpuUtilization: number;
  gpuMemory: number;
  cpuUtilization: number;
  memoryUtilization: number;
  apiTokensUsed: number;
  apiTokensLimit: number;
  activeInferences: number;
  queuedJobs: number;
  estimatedCost: number;
}

export interface SystemLatency {
  timestamp: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  throughput: number;
}

// ============================================
// Training Center Types
// ============================================

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'overview' | 'feature' | 'advanced' | 'admin';
  icon: string;
  color: string;
  content: string;
  order: number;
  estimatedMinutes: number;
  prerequisites?: string[];
}

export interface UserProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: string;
  quizScore?: number;
}

// ============================================
// Common Filter Types
// ============================================

export interface ReportFilters {
  region?: Region | 'All';
  segment?: Segment | 'All';
  vertical?: Vertical | 'All';
  lob?: LOB | 'All';
  dateRange?: {
    start: string;
    end: string;
  };
}

export const REGIONS: Region[] = ['North America', 'Europe', 'Middle East', 'Asia Pacific', 'Latin America'];
export const VERTICALS: Vertical[] = ['CPG', 'AIM', 'TMT', 'E&U', 'LS', 'Others'];
export const LOBS: LOB[] = ['Software', 'Services'];
export const SEGMENTS: Segment[] = ['Enterprise', 'Mid-Market', 'SMB'];
