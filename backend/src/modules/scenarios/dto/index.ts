import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssumptionDto {
  @ApiProperty({ description: 'Variable name' })
  @IsString()
  variable: string;

  @ApiProperty({ description: 'Base value' })
  @IsNumber()
  base_value: number;

  @ApiPropertyOptional({ description: 'Minimum value for range' })
  @IsOptional()
  @IsNumber()
  min_value?: number;

  @ApiPropertyOptional({ description: 'Maximum value for range' })
  @IsOptional()
  @IsNumber()
  max_value?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Category of assumption' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateScenarioDto {
  @ApiProperty({ description: 'Scenario name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Scenario description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['budget', 'forecast', 'what_if', 'sensitivity'] })
  @IsEnum(['budget', 'forecast', 'what_if', 'sensitivity'])
  type: string;

  @ApiPropertyOptional({ description: 'Base scenario ID to copy from' })
  @IsOptional()
  @IsString()
  base_scenario_id?: string;

  @ApiPropertyOptional({ description: 'Scenario assumptions', type: [AssumptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssumptionDto)
  assumptions?: AssumptionDto[];

  @ApiPropertyOptional({ description: 'Time horizon in months', default: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  time_horizon?: number;
}

export class UpdateScenarioDto {
  @ApiPropertyOptional({ description: 'Scenario name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Scenario description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'approved', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'approved', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: 'Scenario assumptions', type: [AssumptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssumptionDto)
  assumptions?: AssumptionDto[];
}

export class GetScenariosDto {
  @ApiPropertyOptional({ enum: ['budget', 'forecast', 'what_if', 'sensitivity'] })
  @IsOptional()
  @IsEnum(['budget', 'forecast', 'what_if', 'sensitivity'])
  type?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'approved', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'approved', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created_by?: string;

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

export class RunSimulationDto {
  @ApiProperty({ description: 'Scenario ID' })
  @IsString()
  scenario_id: string;

  @ApiPropertyOptional({ description: 'Number of iterations for Monte Carlo', default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  iterations?: number;

  @ApiPropertyOptional({ description: 'Confidence level for intervals', default: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(0.99)
  confidence_level?: number;
}

export class CompareScenarioDto {
  @ApiProperty({ description: 'Scenario IDs to compare', type: [String] })
  @IsArray()
  @IsString({ each: true })
  scenario_ids: string[];

  @ApiPropertyOptional({ description: 'Metrics to compare' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class SensitivityAnalysisDto {
  @ApiProperty({ description: 'Scenario ID' })
  @IsString()
  scenario_id: string;

  @ApiProperty({ description: 'Variables to analyze' })
  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @ApiPropertyOptional({ description: 'Range percentage for sensitivity', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  range_percent?: number;

  @ApiPropertyOptional({ description: 'Number of steps in analysis', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(50)
  steps?: number;
}

export class ApproveScenarioDto {
  @ApiProperty({ description: 'Approval comments' })
  @IsString()
  comments: string;

  @ApiPropertyOptional({ description: 'Set as active baseline' })
  @IsOptional()
  @IsBoolean()
  set_as_baseline?: boolean;
}
