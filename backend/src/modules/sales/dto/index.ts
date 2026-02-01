import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPipelineDto {
  @ApiPropertyOptional({ enum: ['current_quarter', 'next_quarter', 'fiscal_year'] })
  @IsOptional()
  @IsEnum(['current_quarter', 'next_quarter', 'fiscal_year'])
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stage?: string[];
}

export class GetDealsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount_gte?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount_lte?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  close_date_gte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  close_date_lte?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  risk_level?: string;

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

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  account_name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  close_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lob?: string;
}

export class UpdateDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  close_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_step?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
