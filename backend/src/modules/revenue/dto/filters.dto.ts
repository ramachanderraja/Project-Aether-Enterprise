import { IsOptional, IsString, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

function ToArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  });
}

/**
 * Common filter DTO shared by all Revenue page endpoints.
 */
export class RevenueFilterDto {
  @ApiPropertyOptional({ type: [String], description: 'Year filter (multi-select)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  year?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Month filter (multi-select, e.g. ?month=Jan)' })
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

  @ApiPropertyOptional({ type: [String], description: 'Platform filter (multi-select, e.g. Quantum, SMART, Cost Drivers)' })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsString({ each: true })
  platform?: string[];

  @ApiPropertyOptional({ description: 'Quantum/SMART filter (single: All|Quantum|SMART)', default: 'All' })
  @IsOptional()
  @IsString()
  quantumSmart?: string;

  @ApiPropertyOptional({ description: 'Fees type filter (single: All|Fees|Travel)', default: 'All' })
  @IsOptional()
  @IsString()
  feesType?: string;
}

/**
 * Extended filter for movement endpoints.
 */
export class MovementFilterDto extends RevenueFilterDto {
  @ApiPropertyOptional({ description: 'Lookback period in months (1, 3, 6, or 12)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  lookbackPeriod?: number;
}

/**
 * Extended filter for customer movement detail.
 */
export class CustomerMovementFilterDto extends MovementFilterDto {
  @ApiPropertyOptional({ description: 'Filter by movement type (e.g. Expansion, Contraction, Churn, New)' })
  @IsOptional()
  @IsString()
  movementType?: string;

  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({ description: 'Sort direction: asc or desc', default: 'desc' })
  @IsOptional()
  @IsString()
  sortDirection?: string;
}

/**
 * Extended filter for customer list.
 */
export class CustomerListFilterDto extends RevenueFilterDto {
  @ApiPropertyOptional({ description: 'Search by customer name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Show only 2026 renewals' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  renewals2026?: boolean;

  @ApiPropertyOptional({ description: 'Filter by renewal risk level' })
  @IsOptional()
  @IsString()
  renewalRisk?: string;

  @ApiPropertyOptional({ description: 'Sort field name' })
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiPropertyOptional({ description: 'Sort direction: asc or desc', default: 'desc' })
  @IsOptional()
  @IsString()
  sortDirection?: string;
}

/**
 * Extended filter for products endpoint.
 */
export class ProductsFilterDto extends RevenueFilterDto {
  @ApiPropertyOptional({ description: 'Product category filter' })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiPropertyOptional({ description: 'Product sub-category filter' })
  @IsOptional()
  @IsString()
  productSubCategory?: string;
}
