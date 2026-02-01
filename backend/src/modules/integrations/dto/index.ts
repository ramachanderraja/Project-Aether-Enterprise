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
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIntegrationDto {
  @ApiProperty({ description: 'Integration name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['salesforce', 'hubspot', 'netsuite', 'sap', 'workday', 'slack', 'teams', 'jira', 'custom'] })
  @IsEnum(['salesforce', 'hubspot', 'netsuite', 'sap', 'workday', 'slack', 'teams', 'jira', 'custom'])
  type: string;

  @ApiPropertyOptional({ description: 'Integration description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Authentication configuration' })
  @IsObject()
  auth_config: Record<string, any>;

  @ApiPropertyOptional({ description: 'Webhook URL for incoming data' })
  @IsOptional()
  @IsUrl()
  webhook_url?: string;

  @ApiPropertyOptional({ description: 'Scopes/permissions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

export class UpdateIntegrationDto {
  @ApiPropertyOptional({ description: 'Integration name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Integration description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Authentication configuration' })
  @IsOptional()
  @IsObject()
  auth_config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Enable/disable integration' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  integration_id: string;

  @ApiProperty({ description: 'Event types to listen for' })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ description: 'Target URL for outgoing webhooks' })
  @IsOptional()
  @IsUrl()
  target_url?: string;

  @ApiPropertyOptional({ description: 'Webhook secret for verification' })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class GetWebhookLogsDto {
  @ApiPropertyOptional({ description: 'Webhook ID' })
  @IsOptional()
  @IsString()
  webhook_id?: string;

  @ApiPropertyOptional({ enum: ['success', 'failed', 'pending'] })
  @IsOptional()
  @IsEnum(['success', 'failed', 'pending'])
  status?: string;

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

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'API key description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permissions for this API key' })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ description: 'Rate limit per minute', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rate_limit?: number;

  @ApiPropertyOptional({ description: 'Expiration in days (null for no expiration)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expires_in_days?: number;
}

export class OAuthCallbackDto {
  @ApiProperty({ description: 'Authorization code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'State parameter for CSRF protection' })
  @IsString()
  state: string;
}

export class TestIntegrationDto {
  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  integration_id: string;

  @ApiPropertyOptional({ description: 'Specific test to run' })
  @IsOptional()
  @IsEnum(['auth', 'connectivity', 'permissions', 'all'])
  test_type?: string;
}
