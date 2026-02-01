import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  GetAuditLogsDto,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  GetComplianceReportDto,
  CreateApprovalWorkflowDto,
  SubmitApprovalRequestDto,
  ProcessApprovalDto,
  GetDataLineageDto,
} from './dto';

interface AuditLog {
  id: string;
  timestamp: Date;
  actor_type: string;
  actor_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  tenant_id: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permission_ids: string[];
  data_scope: any;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: string;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  resource_type: string;
  steps: any[];
  conditions: any;
  is_active: boolean;
  created_at: Date;
}

interface ApprovalRequest {
  id: string;
  workflow_id: string;
  resource_type: string;
  resource_id: string;
  requester_id: string;
  status: string;
  current_step: number;
  approvals: any[];
  comments: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class GovernanceService {
  private auditLogs: AuditLog[] = [];
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Initialize permissions
    const permissions: Permission[] = [
      { id: 'perm_001', name: 'View Dashboard', description: 'View executive dashboard', resource: 'dashboard', action: 'read', scope: 'all' },
      { id: 'perm_002', name: 'Edit Scenarios', description: 'Create and edit scenarios', resource: 'scenarios', action: 'write', scope: 'own' },
      { id: 'perm_003', name: 'Approve Scenarios', description: 'Approve scenario submissions', resource: 'scenarios', action: 'approve', scope: 'all' },
      { id: 'perm_004', name: 'View Sales Data', description: 'View sales pipeline and deals', resource: 'sales', action: 'read', scope: 'region' },
      { id: 'perm_005', name: 'Edit Deals', description: 'Create and edit deals', resource: 'deals', action: 'write', scope: 'own' },
      { id: 'perm_006', name: 'View Cost Data', description: 'View cost intelligence data', resource: 'costs', action: 'read', scope: 'all' },
      { id: 'perm_007', name: 'Manage Users', description: 'Create and manage user accounts', resource: 'users', action: 'admin', scope: 'tenant' },
      { id: 'perm_008', name: 'Manage Roles', description: 'Create and manage roles', resource: 'roles', action: 'admin', scope: 'tenant' },
      { id: 'perm_009', name: 'View Audit Logs', description: 'View audit trail', resource: 'audit', action: 'read', scope: 'all' },
      { id: 'perm_010', name: 'Export Data', description: 'Export data to files', resource: 'export', action: 'execute', scope: 'all' },
    ];
    permissions.forEach(p => this.permissions.set(p.id, p));

    // Initialize roles
    const roles: Role[] = [
      {
        id: 'role_001',
        name: 'Administrator',
        description: 'Full system access',
        permission_ids: permissions.map(p => p.id),
        data_scope: { all: true },
        is_system: true,
        is_active: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      },
      {
        id: 'role_002',
        name: 'FP&A Manager',
        description: 'Financial planning and analysis manager',
        permission_ids: ['perm_001', 'perm_002', 'perm_003', 'perm_004', 'perm_006', 'perm_009', 'perm_010'],
        data_scope: { departments: ['finance', 'accounting'] },
        is_system: true,
        is_active: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      },
      {
        id: 'role_003',
        name: 'Sales Manager',
        description: 'Sales team manager',
        permission_ids: ['perm_001', 'perm_004', 'perm_005'],
        data_scope: { regions: ['all'] },
        is_system: true,
        is_active: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      },
      {
        id: 'role_004',
        name: 'Analyst',
        description: 'Read-only access to analytics',
        permission_ids: ['perm_001', 'perm_004', 'perm_006'],
        data_scope: { departments: ['all'], readonly: true },
        is_system: false,
        is_active: true,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
      },
    ];
    roles.forEach(r => this.roles.set(r.id, r));

    // Initialize audit logs
    this.auditLogs = [
      {
        id: 'log_001',
        timestamp: new Date(),
        actor_type: 'user',
        actor_id: 'user_001',
        actor_name: 'John Smith',
        action: 'create',
        resource_type: 'scenario',
        resource_id: 'scn_001',
        resource_name: 'FY2024 Base Budget',
        tenant_id: 'tenant_001',
      },
      {
        id: 'log_002',
        timestamp: new Date(Date.now() - 3600000),
        actor_type: 'user',
        actor_id: 'user_002',
        actor_name: 'Jane Doe',
        action: 'approve',
        resource_type: 'scenario',
        resource_id: 'scn_001',
        resource_name: 'FY2024 Base Budget',
        changes: { status: { from: 'active', to: 'approved' } },
        tenant_id: 'tenant_001',
      },
      {
        id: 'log_003',
        timestamp: new Date(Date.now() - 7200000),
        actor_type: 'user',
        actor_id: 'user_001',
        actor_name: 'John Smith',
        action: 'update',
        resource_type: 'deal',
        resource_id: 'deal_001',
        resource_name: 'Acme Corp Enterprise Deal',
        changes: { amount: { from: 450000, to: 500000 }, stage: { from: 'negotiation', to: 'closed_won' } },
        tenant_id: 'tenant_001',
      },
      {
        id: 'log_004',
        timestamp: new Date(Date.now() - 86400000),
        actor_type: 'ai',
        actor_id: 'ai_agent',
        actor_name: 'Aether AI',
        action: 'read',
        resource_type: 'report',
        resource_id: 'rpt_001',
        resource_name: 'Monthly Financial Summary',
        tenant_id: 'tenant_001',
      },
      {
        id: 'log_005',
        timestamp: new Date(Date.now() - 172800000),
        actor_type: 'system',
        actor_id: 'system',
        actor_name: 'System',
        action: 'export',
        resource_type: 'report',
        resource_id: 'rpt_002',
        resource_name: 'Q1 Sales Analysis',
        tenant_id: 'tenant_001',
      },
    ];

    // Initialize workflows
    const workflows: ApprovalWorkflow[] = [
      {
        id: 'wf_001',
        name: 'Budget Approval Workflow',
        resource_type: 'scenario',
        steps: [
          { order: 1, name: 'Department Head Review', approver_type: 'role', approver_id: 'role_002', required_approvals: 1 },
          { order: 2, name: 'Finance Director Approval', approver_type: 'user', approver_id: 'user_003', required_approvals: 1 },
          { order: 3, name: 'CFO Final Approval', approver_type: 'user', approver_id: 'user_004', required_approvals: 1 },
        ],
        conditions: { amount_threshold: 1000000 },
        is_active: true,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'wf_002',
        name: 'Deal Approval Workflow',
        resource_type: 'deal',
        steps: [
          { order: 1, name: 'Sales Manager Review', approver_type: 'role', approver_id: 'role_003', required_approvals: 1 },
          { order: 2, name: 'Legal Review', approver_type: 'role', approver_id: 'role_005', required_approvals: 1 },
        ],
        conditions: { amount_threshold: 500000 },
        is_active: true,
        created_at: new Date('2024-01-15'),
      },
    ];
    workflows.forEach(w => this.workflows.set(w.id, w));
  }

  // Audit Logs
  async getAuditLogs(dto: GetAuditLogsDto): Promise<{
    data: AuditLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    let logs = [...this.auditLogs];

    // Apply filters
    if (dto.actor_type) {
      logs = logs.filter(l => l.actor_type === dto.actor_type);
    }
    if (dto.actor_id) {
      logs = logs.filter(l => l.actor_id === dto.actor_id);
    }
    if (dto.action) {
      logs = logs.filter(l => l.action === dto.action);
    }
    if (dto.resource_type) {
      logs = logs.filter(l => l.resource_type === dto.resource_type);
    }
    if (dto.resource_id) {
      logs = logs.filter(l => l.resource_id === dto.resource_id);
    }
    if (dto.from_date) {
      const fromDate = new Date(dto.from_date);
      logs = logs.filter(l => l.timestamp >= fromDate);
    }
    if (dto.to_date) {
      const toDate = new Date(dto.to_date);
      logs = logs.filter(l => l.timestamp <= toDate);
    }

    // Sort by timestamp desc
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

  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date(),
      actor_type: log.actor_type || 'system',
      actor_id: log.actor_id || 'system',
      actor_name: log.actor_name || 'System',
      action: log.action || 'unknown',
      resource_type: log.resource_type || 'unknown',
      resource_id: log.resource_id || '',
      resource_name: log.resource_name || '',
      changes: log.changes,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      tenant_id: log.tenant_id || 'tenant_001',
    };

    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values()).filter(r => r.is_active);
  }

  async getRoleById(id: string): Promise<Role> {
    const role = this.roles.get(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const id = `role_${Date.now()}`;

    const role: Role = {
      id,
      name: dto.name,
      description: dto.description || '',
      permission_ids: dto.permission_ids,
      data_scope: dto.data_scope || {},
      is_system: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.roles.set(id, role);

    await this.createAuditLog({
      action: 'create',
      resource_type: 'role',
      resource_id: id,
      resource_name: dto.name,
    });

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id);

    if (role.is_system && dto.is_active === false) {
      throw new BadRequestException('Cannot deactivate system roles');
    }

    const updated: Role = {
      ...role,
      ...dto,
      updated_at: new Date(),
    };

    this.roles.set(id, updated);

    await this.createAuditLog({
      action: 'update',
      resource_type: 'role',
      resource_id: id,
      resource_name: role.name,
      changes: dto,
    });

    return updated;
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (role.is_system) {
      throw new BadRequestException('Cannot delete system roles');
    }

    this.roles.delete(id);

    await this.createAuditLog({
      action: 'delete',
      resource_type: 'role',
      resource_id: id,
      resource_name: role.name,
    });
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async assignRoles(dto: AssignRoleDto): Promise<{ success: boolean; assigned_roles: string[] }> {
    // Validate roles exist
    for (const roleId of dto.role_ids) {
      await this.getRoleById(roleId);
    }

    await this.createAuditLog({
      action: 'update',
      resource_type: 'user',
      resource_id: dto.user_id,
      resource_name: `User ${dto.user_id}`,
      changes: { roles: dto.role_ids },
    });

    return {
      success: true,
      assigned_roles: dto.role_ids,
    };
  }

  // Compliance Reports
  async getComplianceReport(dto: GetComplianceReportDto): Promise<{
    report_type: string;
    generated_at: Date;
    period: { from: Date; to: Date };
    summary: any;
    findings: any[];
    recommendations: any[];
  }> {
    const fromDate = dto.from_date ? new Date(dto.from_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dto.to_date ? new Date(dto.to_date) : new Date();

    const reportConfig = {
      sox: {
        title: 'SOX Compliance Report',
        areas: ['access_controls', 'change_management', 'segregation_of_duties', 'audit_trail'],
      },
      gdpr: {
        title: 'GDPR Compliance Report',
        areas: ['data_access', 'consent_management', 'data_retention', 'right_to_erasure'],
      },
      internal: {
        title: 'Internal Controls Report',
        areas: ['approval_workflows', 'data_quality', 'access_reviews', 'policy_compliance'],
      },
      custom: {
        title: 'Custom Compliance Report',
        areas: dto.areas || ['general'],
      },
    };

    const config = reportConfig[dto.report_type] || reportConfig.internal;

    return {
      report_type: dto.report_type,
      generated_at: new Date(),
      period: { from: fromDate, to: toDate },
      summary: {
        overall_score: 87,
        controls_tested: 45,
        controls_passed: 39,
        controls_failed: 4,
        controls_need_attention: 2,
        risk_level: 'low',
      },
      findings: [
        {
          id: 'f_001',
          severity: 'medium',
          area: 'access_controls',
          title: 'Inactive User Accounts',
          description: '3 user accounts have not been accessed in over 90 days',
          remediation: 'Review and disable inactive accounts',
          status: 'open',
        },
        {
          id: 'f_002',
          severity: 'low',
          area: 'audit_trail',
          title: 'Missing Export Logs',
          description: 'Some data exports were not properly logged',
          remediation: 'Ensure all export operations are captured in audit trail',
          status: 'in_progress',
        },
        {
          id: 'f_003',
          severity: 'high',
          area: 'approval_workflows',
          title: 'Bypassed Approval Steps',
          description: '2 scenarios were approved without required manager review',
          remediation: 'Enforce mandatory approval workflow for all scenarios above threshold',
          status: 'resolved',
        },
      ],
      recommendations: [
        {
          priority: 'high',
          area: 'access_controls',
          recommendation: 'Implement automated account deactivation after 90 days of inactivity',
          estimated_effort: '2 weeks',
        },
        {
          priority: 'medium',
          area: 'segregation_of_duties',
          recommendation: 'Review and update role assignments to ensure proper separation',
          estimated_effort: '1 week',
        },
        {
          priority: 'low',
          area: 'audit_trail',
          recommendation: 'Add more detailed logging for AI agent actions',
          estimated_effort: '3 days',
        },
      ],
    };
  }

  // Approval Workflows
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return Array.from(this.workflows.values()).filter(w => w.is_active);
  }

  async getApprovalWorkflowById(id: string): Promise<ApprovalWorkflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async createApprovalWorkflow(dto: CreateApprovalWorkflowDto): Promise<ApprovalWorkflow> {
    const id = `wf_${Date.now()}`;

    const workflow: ApprovalWorkflow = {
      id,
      name: dto.name,
      resource_type: dto.resource_type,
      steps: dto.steps,
      conditions: dto.conditions || {},
      is_active: true,
      created_at: new Date(),
    };

    this.workflows.set(id, workflow);

    await this.createAuditLog({
      action: 'create',
      resource_type: 'workflow',
      resource_id: id,
      resource_name: dto.name,
    });

    return workflow;
  }

  async submitApprovalRequest(dto: SubmitApprovalRequestDto, userId: string): Promise<ApprovalRequest> {
    // Find applicable workflow
    const workflows = Array.from(this.workflows.values()).filter(
      w => w.resource_type === dto.resource_type && w.is_active
    );

    if (workflows.length === 0) {
      throw new BadRequestException(`No active workflow found for resource type ${dto.resource_type}`);
    }

    const workflow = workflows[0];
    const id = `req_${Date.now()}`;

    const request: ApprovalRequest = {
      id,
      workflow_id: workflow.id,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id,
      requester_id: userId,
      status: 'pending',
      current_step: 1,
      approvals: [],
      comments: dto.comments || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.approvalRequests.set(id, request);

    await this.createAuditLog({
      actor_id: userId,
      action: 'create',
      resource_type: 'approval_request',
      resource_id: id,
      resource_name: `Approval for ${dto.resource_type} ${dto.resource_id}`,
    });

    return request;
  }

  async getApprovalRequests(userId: string, status?: string): Promise<ApprovalRequest[]> {
    let requests = Array.from(this.approvalRequests.values());

    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    return requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async processApproval(requestId: string, dto: ProcessApprovalDto, userId: string): Promise<ApprovalRequest> {
    const request = this.approvalRequests.get(requestId);
    if (!request) {
      throw new NotFoundException(`Approval request with ID ${requestId} not found`);
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request is no longer pending');
    }

    const workflow = await this.getApprovalWorkflowById(request.workflow_id);
    const currentStep = workflow.steps.find(s => s.order === request.current_step);

    if (!currentStep) {
      throw new BadRequestException('Invalid workflow step');
    }

    const approval = {
      step: request.current_step,
      step_name: currentStep.name,
      approver_id: userId,
      decision: dto.decision,
      comments: dto.comments,
      timestamp: new Date(),
    };

    request.approvals.push(approval);
    request.updated_at = new Date();

    if (dto.decision === 'approve') {
      if (request.current_step >= workflow.steps.length) {
        request.status = 'approved';
      } else {
        request.current_step++;
      }
    } else if (dto.decision === 'reject') {
      request.status = 'rejected';
    } else {
      request.status = 'changes_requested';
    }

    this.approvalRequests.set(requestId, request);

    await this.createAuditLog({
      actor_id: userId,
      action: dto.decision,
      resource_type: 'approval_request',
      resource_id: requestId,
      resource_name: `Approval for ${request.resource_type} ${request.resource_id}`,
      changes: { decision: dto.decision, comments: dto.comments },
    });

    return request;
  }

  // Data Lineage
  async getDataLineage(dto: GetDataLineageDto): Promise<{
    resource: { type: string; id: string; name: string };
    lineage: any;
  }> {
    // Mock data lineage
    return {
      resource: {
        type: dto.resource_type,
        id: dto.resource_id,
        name: `${dto.resource_type.charAt(0).toUpperCase() + dto.resource_type.slice(1)} ${dto.resource_id}`,
      },
      lineage: {
        upstream: [
          {
            type: 'data_source',
            id: 'ds_salesforce',
            name: 'Salesforce CRM',
            fields: ['opportunity_amount', 'close_date', 'stage'],
            last_sync: new Date(Date.now() - 3600000),
          },
          {
            type: 'data_source',
            id: 'ds_netsuite',
            name: 'NetSuite ERP',
            fields: ['revenue', 'costs', 'gl_accounts'],
            last_sync: new Date(Date.now() - 7200000),
          },
          {
            type: 'transformation',
            id: 'tf_001',
            name: 'Currency Normalization',
            applied_at: new Date(Date.now() - 1800000),
          },
        ],
        downstream: [
          {
            type: 'report',
            id: 'rpt_001',
            name: 'Executive Dashboard',
            depends_on: ['revenue', 'pipeline_value'],
          },
          {
            type: 'scenario',
            id: 'scn_002',
            name: 'Aggressive Growth Scenario',
            depends_on: ['base_revenue', 'growth_rate'],
          },
        ],
        transformations: [
          {
            id: 'tf_001',
            name: 'Currency Normalization',
            description: 'Converts all amounts to USD using daily exchange rates',
            type: 'calculation',
          },
          {
            id: 'tf_002',
            name: 'Pipeline Weighting',
            description: 'Applies probability weights to opportunity values',
            type: 'calculation',
          },
        ],
      },
    };
  }

  // Access Review
  async getAccessReview(): Promise<{
    summary: any;
    users: any[];
    roles: any[];
    recommendations: any[];
  }> {
    return {
      summary: {
        total_users: 45,
        active_users: 42,
        inactive_users: 3,
        privileged_users: 5,
        last_review_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        next_review_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      users: [
        {
          id: 'user_001',
          name: 'John Smith',
          email: 'john.smith@company.com',
          roles: ['Administrator'],
          last_activity: new Date(Date.now() - 3600000),
          status: 'active',
          risk_level: 'high',
        },
        {
          id: 'user_002',
          name: 'Jane Doe',
          email: 'jane.doe@company.com',
          roles: ['FP&A Manager'],
          last_activity: new Date(Date.now() - 86400000),
          status: 'active',
          risk_level: 'medium',
        },
        {
          id: 'user_003',
          name: 'Bob Wilson',
          email: 'bob.wilson@company.com',
          roles: ['Analyst'],
          last_activity: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          status: 'inactive',
          risk_level: 'low',
        },
      ],
      roles: [
        {
          id: 'role_001',
          name: 'Administrator',
          user_count: 2,
          permission_count: 10,
          last_modified: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          risk_level: 'high',
        },
        {
          id: 'role_002',
          name: 'FP&A Manager',
          user_count: 5,
          permission_count: 7,
          last_modified: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          risk_level: 'medium',
        },
      ],
      recommendations: [
        {
          type: 'deactivate_user',
          user_id: 'user_003',
          reason: 'Inactive for over 90 days',
          priority: 'medium',
        },
        {
          type: 'review_access',
          user_id: 'user_001',
          reason: 'Administrator with high privileges requires periodic review',
          priority: 'high',
        },
      ],
    };
  }
}
