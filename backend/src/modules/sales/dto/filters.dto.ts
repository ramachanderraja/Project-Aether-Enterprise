import { IsOptional, IsString, IsArray, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transforms a query param that can appear as a single string or repeated params
 * into a string array. E.g. ?year=2025&year=2026 -> ['2025','2026']
 */
function ToArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  });
}

/**
 * Common filter DTO shared by all Sales page endpoints.
 * All filters are optional; empty/missing = "all".
 */
export class SalesFilterDto {
  @ApiPropertyOptional({ type: [String], description: 'Year filter (multi-select, e.g. ?year=2025&year=2026)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  year?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Quarter filter (multi-select, e.g. ?quarter=Q1&quarter=Q2)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  quarter?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Month filter (multi-select, e.g. ?month=Jan&month=Feb)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  month?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Region filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  region?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Vertical filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  vertical?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Segment filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  segment?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Logo type filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  logoType?: string[];

  @ApiPropertyOptional({ description: 'Sold By filter (single: All|Sales|GD|TSO)', default: 'All' })
  @IsOptional()
  @IsString()
  soldBy?: string;

  @ApiPropertyOptional({ description: 'Revenue type filter (single: License|Implementation|All)', default: 'All' })
  @IsOptional()
  @IsString()
  revenueType?: string;

  @ApiPropertyOptional({ type: [String], description: 'Product category filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  productCategory?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Product sub-category filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  productSubCategory?: string[];
}

/**
 * Extended filter for pipeline movement endpoint.
 */
export class PipelineMovementFilterDto extends SalesFilterDto {
  @ApiPropertyOptional({ description: 'Target month in YYYY-MM format (defaults to latest)' })
  @IsOptional()
  @IsString()
  targetMonth?: string;
}

/**
 * Extended filter for key deals / closed deals endpoints.
 */
export class DealsFilterDto extends SalesFilterDto {
  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({ description: 'Sort direction: asc or desc', default: 'desc' })
  @IsOptional()
  @IsString()
  sortDirection?: string;

  @ApiPropertyOptional({ description: 'Maximum number of deals to return' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

/**
 * Extended filter for quota/salespeople endpoint.
 */
export class QuotaFilterDto extends SalesFilterDto {
  @ApiPropertyOptional({ description: 'Name search filter' })
  @IsOptional()
  @IsString()
  nameFilter?: string;

  @ApiPropertyOptional({ description: 'Region filter for the table' })
  @IsOptional()
  @IsString()
  regionFilter?: string;

  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({ description: 'Sort direction: asc or desc', default: 'desc' })
  @IsOptional()
  @IsString()
  sortDirection?: string;
}
