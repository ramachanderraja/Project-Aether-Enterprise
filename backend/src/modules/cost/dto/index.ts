import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCostDto {
  @ApiPropertyOptional({ enum: ['mtd', 'qtd', 'ytd', 'custom'] })
  @IsOptional()
  @IsEnum(['mtd', 'qtd', 'ytd', 'custom'])
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cost_center?: string;
}
