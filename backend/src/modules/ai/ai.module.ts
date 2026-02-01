import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { GeminiService } from './services/gemini.service';
import { ConversationService } from './services/conversation.service';
import { ContextService } from './services/context.service';

@Module({
  imports: [],
  controllers: [AIController],
  providers: [AIService, GeminiService, ConversationService, ContextService],
  exports: [AIService, GeminiService],
})
export class AIModule {}
