import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GovernanceService } from './governance.service';
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

@ApiTags('Governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(@Query() query: GetAuditLogsDto) {
    return this.governanceService.getAuditLogs(query);
  }

  // Role Management
  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async getRoles() {
    return this.governanceService.getRoles();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string) {
    return this.governanceService.getRoleById(id);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.governanceService.createRole(dto);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.governanceService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role' })
  async deleteRole(@Param('id') id: string) {
    return this.governanceService.deleteRole(id);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async getPermissions() {
    return this.governanceService.getPermissions();
  }

  @Post('roles/assign')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiResponse({ status: 200, description: 'Roles assigned' })
  async assignRoles(@Body() dto: AssignRoleDto) {
    return this.governanceService.assignRoles(dto);
  }

  // Compliance Reports
  @Post('compliance/report')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  async getComplianceReport(@Body() dto: GetComplianceReportDto) {
    return this.governanceService.getComplianceReport(dto);
  }

  // Approval Workflows
  @Get('workflows')
  @ApiOperation({ summary: 'Get all approval workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows' })
  async getApprovalWorkflows() {
    return this.governanceService.getApprovalWorkflows();
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  async getApprovalWorkflowById(@Param('id') id: string) {
    return this.governanceService.getApprovalWorkflowById(id);
  }

  @Post('workflows')
  @ApiOperation({ summary: 'Create approval workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created' })
  async createApprovalWorkflow(@Body() dto: CreateApprovalWorkflowDto) {
    return this.governanceService.createApprovalWorkflow(dto);
  }

  // Approval Requests
  @Get('approvals')
  @ApiOperation({ summary: 'Get approval requests' })
  @ApiResponse({ status: 200, description: 'List of approval requests' })
  async getApprovalRequests(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.governanceService.getApprovalRequests(req.user.id, status);
  }

  @Post('approvals')
  @ApiOperation({ summary: 'Submit approval request' })
  @ApiResponse({ status: 201, description: 'Request submitted' })
  async submitApprovalRequest(@Body() dto: SubmitApprovalRequestDto, @Request() req) {
    return this.governanceService.submitApprovalRequest(dto, req.user.id);
  }

  @Post('approvals/:id/process')
  @ApiOperation({ summary: 'Process approval request' })
  @ApiParam({ name: 'id', description: 'Approval request ID' })
  @ApiResponse({ status: 200, description: 'Request processed' })
  async processApproval(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalDto,
    @Request() req,
  ) {
    return this.governanceService.processApproval(id, dto, req.user.id);
  }

  // Data Lineage
  @Post('lineage')
  @ApiOperation({ summary: 'Get data lineage for a resource' })
  @ApiResponse({ status: 200, description: 'Data lineage retrieved' })
  async getDataLineage(@Body() dto: GetDataLineageDto) {
    return this.governanceService.getDataLineage(dto);
  }

  // Access Review
  @Get('access-review')
  @ApiOperation({ summary: 'Get access review summary' })
  @ApiResponse({ status: 200, description: 'Access review data' })
  async getAccessReview() {
    return this.governanceService.getAccessReview();
  }
}
