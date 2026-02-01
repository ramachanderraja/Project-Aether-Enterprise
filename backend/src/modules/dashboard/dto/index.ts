import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDashboardDto {
  @ApiPropertyOptional({ description: 'Point-in-time date', example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  as_of_date?: string;

  @ApiPropertyOptional({ enum: ['mom', 'qoq', 'yoy'], description: 'Comparison period' })
  @IsOptional()
  @IsEnum(['mom', 'qoq', 'yoy'])
  comparison_period?: 'mom' | 'qoq' | 'yoy';

  @ApiPropertyOptional({ description: 'Filter by region' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by line of business' })
  @IsOptional()
  @IsString()
  lob?: string;
}

export class GetAnomaliesDto {
  @ApiPropertyOptional({ enum: ['critical', 'high', 'medium', 'low'] })
  @IsOptional()
  @IsEnum(['critical', 'high', 'medium', 'low'])
  severity?: string;

  @ApiPropertyOptional({ enum: ['unresolved', 'investigating', 'resolved', 'dismissed'] })
  @IsOptional()
  @IsEnum(['unresolved', 'investigating', 'resolved', 'dismissed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['cost_spike', 'revenue_drop', 'variance', 'pattern'] })
  @IsOptional()
  @IsEnum(['cost_spike', 'revenue_drop', 'variance', 'pattern'])
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

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

export class UpdateAnomalyDto {
  @ApiPropertyOptional({ enum: ['unresolved', 'investigating', 'resolved', 'dismissed'] })
  @IsOptional()
  @IsEnum(['unresolved', 'investigating', 'resolved', 'dismissed'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetKpiDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  as_of_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lob?: string;
}
