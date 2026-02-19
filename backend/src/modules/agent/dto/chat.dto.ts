import { IsString, IsOptional, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatDto {
  @IsString()
  @MaxLength(4000)
  message: string;

  @IsString()
  agentKey: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];
}
