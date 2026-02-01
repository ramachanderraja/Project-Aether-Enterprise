import { IsOptional, IsString, IsObject, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'Context type', example: 'dashboard' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Initial message to start conversation' })
  @IsOptional()
  @IsString()
  initial_message?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional context for the message' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class GetSuggestionsDto {
  @ApiProperty({ description: 'Current UI context' })
  @IsString()
  context: string;

  @ApiPropertyOptional({ description: 'Max suggestions', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}

export class AnalyzeDataDto {
  @ApiProperty({ description: 'Type of data being analyzed' })
  @IsString()
  data_type: string;

  @ApiProperty({ description: 'Data to analyze' })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({ description: 'Question or analysis request' })
  @IsString()
  question: string;
}
