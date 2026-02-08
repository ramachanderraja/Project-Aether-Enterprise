import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetModulesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category', example: 'fundamentals' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CompleteModuleDto {
  @ApiPropertyOptional({ description: 'Time spent on module in minutes', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  timeSpentMin?: number;
}

export class TrainingModuleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string | null;
  @ApiProperty() category: string;
  @ApiProperty() duration: string;
  @ApiProperty() sortOrder: number;
  @ApiProperty() isCompleted: boolean;
}

export class TrainingModuleDetailResponseDto extends TrainingModuleResponseDto {
  @ApiProperty() content: Record<string, unknown> | null;
  @ApiProperty() resources: Record<string, unknown>[] | null;
}

export class TrainingProgressResponseDto {
  @ApiProperty() completedModules: string[];
  @ApiProperty() totalModules: number;
  @ApiProperty() percentComplete: number;
  @ApiProperty() lastActivity: string | null;
  @ApiProperty() totalTimeSpentMin: number;
  @ApiProperty() streak: number;
}

export class CertificateResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string | null;
  @ApiProperty() status: 'earned' | 'available';
  @ApiProperty() progress: number;
  @ApiProperty() requiredModules: string[];
  @ApiProperty() completedModules: string[];
  @ApiPropertyOptional() issuedAt?: string;
  @ApiPropertyOptional() expiresAt?: string | null;
}
