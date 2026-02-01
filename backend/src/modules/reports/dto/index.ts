import { IsString, IsOptional, IsDateString, IsEnum, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  REVENUE_ANALYSIS = 'REVENUE_ANALYSIS',
  COST_BREAKDOWN = 'COST_BREAKDOWN',
  SALES_PIPELINE = 'SALES_PIPELINE',
  SCENARIO_COMPARISON = 'SCENARIO_COMPARISON',
  AUDIT_LOG = 'AUDIT_LOG',
  FORECAST = 'FORECAST',
  CUSTOM = 'CUSTOM',
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  POWERPOINT = 'POWERPOINT',
  JSON = 'JSON',
}

export enum ReportFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export class ReportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scenarios?: string[];
}

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeDataTables?: boolean;
}

export class ScheduleReportDto {
  @ApiProperty()
  @IsString()
  reportId: string;

  @ApiProperty({ enum: ReportFrequency })
  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReportTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  sections: string[];

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  defaultFilters?: ReportFilterDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeDataTables?: boolean;
}

export class ExportDataDto {
  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty()
  @IsString()
  dataType: string;

  @ApiPropertyOptional({ type: ReportFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];
}
