import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetAuditLogsDto {
  @ApiPropertyOptional({ enum: ['user', 'system', 'ai', 'integration'] })
  @IsOptional()
  @IsEnum(['user', 'system', 'ai', 'integration'])
  actor_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actor_id?: string;

  @ApiPropertyOptional({ enum: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'login', 'logout'] })
  @IsOptional()
  @IsEnum(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'login', 'logout'])
  action?: string;

  @ApiPropertyOptional({ enum: ['scenario', 'deal', 'budget', 'forecast', 'user', 'role', 'setting', 'report'] })
  @IsOptional()
  @IsEnum(['scenario', 'deal', 'budget', 'forecast', 'user', 'role', 'setting', 'report'])
  resource_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permission IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  permission_ids: string[];

  @ApiPropertyOptional({ description: 'Data access scope' })
  @IsOptional()
  @IsObject()
  data_scope?: Record<string, any>;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permission_ids?: string[];

  @ApiPropertyOptional({ description: 'Data access scope' })
  @IsOptional()
  @IsObject()
  data_scope?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Role IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  role_ids: string[];
}

export class GetComplianceReportDto {
  @ApiProperty({ enum: ['sox', 'gdpr', 'internal', 'custom'] })
  @IsEnum(['sox', 'gdpr', 'internal', 'custom'])
  report_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({ description: 'Specific areas to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];
}

export class CreateApprovalWorkflowDto {
  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['scenario', 'budget', 'forecast', 'deal'] })
  @IsEnum(['scenario', 'budget', 'forecast', 'deal'])
  resource_type: string;

  @ApiProperty({ description: 'Approval steps' })
  @IsArray()
  steps: ApprovalStepDto[];

  @ApiPropertyOptional({ description: 'Trigger conditions' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;
}

export class ApprovalStepDto {
  @ApiProperty({ description: 'Step order' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Step name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Approver type', enum: ['user', 'role', 'manager'] })
  @IsEnum(['user', 'role', 'manager'])
  approver_type: string;

  @ApiProperty({ description: 'Approver ID or role name' })
  @IsString()
  approver_id: string;

  @ApiPropertyOptional({ description: 'Required approvals count', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  required_approvals?: number;
}

export class SubmitApprovalRequestDto {
  @ApiProperty({ description: 'Resource type' })
  @IsString()
  resource_type: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  resource_id: string;

  @ApiPropertyOptional({ description: 'Request comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class ProcessApprovalDto {
  @ApiProperty({ enum: ['approve', 'reject', 'request_changes'] })
  @IsEnum(['approve', 'reject', 'request_changes'])
  decision: string;

  @ApiProperty({ description: 'Decision comments' })
  @IsString()
  comments: string;
}

export class GetDataLineageDto {
  @ApiProperty({ description: 'Resource type' })
  @IsString()
  resource_type: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  resource_id: string;

  @ApiPropertyOptional({ description: 'Depth of lineage tree', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  depth?: number;
}
