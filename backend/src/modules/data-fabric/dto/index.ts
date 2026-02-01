import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDataSourceDto {
  @ApiProperty({ description: 'Data source name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['salesforce', 'netsuite', 'sap', 'workday', 'snowflake', 'bigquery', 'api', 'file', 'database'] })
  @IsEnum(['salesforce', 'netsuite', 'sap', 'workday', 'snowflake', 'bigquery', 'api', 'file', 'database'])
  type: string;

  @ApiPropertyOptional({ description: 'Data source description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Connection configuration' })
  @IsObject()
  connection_config: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sync schedule (cron expression)' })
  @IsOptional()
  @IsString()
  sync_schedule?: string;

  @ApiPropertyOptional({ description: 'Enable real-time sync' })
  @IsOptional()
  @IsBoolean()
  real_time_sync?: boolean;
}

export class UpdateDataSourceDto {
  @ApiPropertyOptional({ description: 'Data source name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Data source description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Connection configuration' })
  @IsOptional()
  @IsObject()
  connection_config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sync schedule (cron expression)' })
  @IsOptional()
  @IsString()
  sync_schedule?: string;

  @ApiPropertyOptional({ description: 'Enable/disable data source' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateDataMappingDto {
  @ApiProperty({ description: 'Mapping name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Source data source ID' })
  @IsString()
  source_id: string;

  @ApiProperty({ description: 'Source entity/table name' })
  @IsString()
  source_entity: string;

  @ApiProperty({ description: 'Target entity in unified model' })
  @IsString()
  target_entity: string;

  @ApiProperty({ description: 'Field mappings' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  field_mappings: FieldMappingDto[];

  @ApiPropertyOptional({ description: 'Transformation rules' })
  @IsOptional()
  @IsArray()
  transformations?: TransformationRuleDto[];
}

export class FieldMappingDto {
  @ApiProperty({ description: 'Source field name' })
  @IsString()
  source_field: string;

  @ApiProperty({ description: 'Target field name' })
  @IsString()
  target_field: string;

  @ApiPropertyOptional({ enum: ['string', 'number', 'date', 'boolean', 'object', 'array'] })
  @IsOptional()
  @IsEnum(['string', 'number', 'date', 'boolean', 'object', 'array'])
  data_type?: string;

  @ApiPropertyOptional({ description: 'Default value if source is null' })
  @IsOptional()
  default_value?: any;

  @ApiPropertyOptional({ description: 'Transformation expression' })
  @IsOptional()
  @IsString()
  transform?: string;
}

export class TransformationRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['convert', 'normalize', 'aggregate', 'filter', 'lookup', 'calculate'] })
  @IsEnum(['convert', 'normalize', 'aggregate', 'filter', 'lookup', 'calculate'])
  type: string;

  @ApiProperty({ description: 'Rule configuration' })
  @IsObject()
  config: Record<string, any>;
}

export class RunSyncDto {
  @ApiProperty({ description: 'Data source ID' })
  @IsString()
  source_id: string;

  @ApiPropertyOptional({ description: 'Full sync or incremental' })
  @IsOptional()
  @IsBoolean()
  full_sync?: boolean;

  @ApiPropertyOptional({ description: 'From date for incremental sync' })
  @IsOptional()
  @IsDateString()
  from_date?: string;
}

export class GetSyncHistoryDto {
  @ApiPropertyOptional({ description: 'Data source ID' })
  @IsOptional()
  @IsString()
  source_id?: string;

  @ApiPropertyOptional({ enum: ['running', 'completed', 'failed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['running', 'completed', 'failed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DataQualityCheckDto {
  @ApiProperty({ description: 'Entity to check' })
  @IsString()
  entity: string;

  @ApiPropertyOptional({ description: 'Specific rules to run' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules?: string[];
}

export class QueryDataDto {
  @ApiProperty({ description: 'Query type', enum: ['sql', 'graphql', 'natural_language'] })
  @IsEnum(['sql', 'graphql', 'natural_language'])
  query_type: string;

  @ApiProperty({ description: 'Query string' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Query parameters' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;
}
