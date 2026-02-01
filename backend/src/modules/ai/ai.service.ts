import { Injectable } from '@nestjs/common';
import { GeminiService } from './services/gemini.service';
import { ConversationService } from './services/conversation.service';
import { ContextService } from './services/context.service';

interface StreamEvent {
  type: string;
  data: any;
}

@Injectable()
export class AIService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly conversationService: ConversationService,
    private readonly contextService: ContextService,
  ) {}

  async *sendMessage(
    conversationId: string,
    message: string,
    context?: any,
  ): AsyncGenerator<StreamEvent> {
    const startTime = Date.now();
    const messageId = `msg_${Date.now()}`;

    // Emit message start
    yield {
      type: 'message_start',
      data: { message_id: messageId, timestamp: new Date().toISOString() },
    };

    // Save user message
    await this.conversationService.addMessage(conversationId, {
      role: 'user',
      content: message,
    });

    // Get conversation history and context
    const conversation = await this.conversationService.getConversation(conversationId);
    const financialContext = await this.contextService.buildFinancialContext(context);

    // Build prompt with context
    const systemPrompt = this.buildSystemPrompt(financialContext);
    const messages = this.buildMessageHistory(conversation.messages);

    // Stream response from Gemini
    let fullResponse = '';
    const citations: any[] = [];

    try {
      const stream = await this.geminiService.streamChat(systemPrompt, messages, message);

      for await (const chunk of stream) {
        fullResponse += chunk.text;

        yield {
          type: 'content_delta',
          data: { text: chunk.text },
        };

        // Check for citations in the chunk
        if (chunk.citations) {
          for (const citation of chunk.citations) {
            citations.push(citation);
            yield {
              type: 'citation',
              data: citation,
            };
          }
        }
      }

      // Generate suggested actions based on response
      const suggestedActions = await this.generateSuggestedActions(message, fullResponse);
      if (suggestedActions.length > 0) {
        yield {
          type: 'suggested_actions',
          data: { actions: suggestedActions },
        };
      }

      // Save assistant message
      await this.conversationService.addMessage(conversationId, {
        role: 'assistant',
        content: fullResponse,
        citations,
        suggestedActions,
      });

      // Emit message complete
      const processingTime = Date.now() - startTime;
      yield {
        type: 'message_complete',
        data: {
          message_id: messageId,
          tokens_used: Math.ceil(fullResponse.length / 4), // Approximate
          processing_time_ms: processingTime,
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        data: { message: error.message },
      };
    }
  }

  async sendMessageSync(conversationId: string, message: string, context?: any) {
    const messageId = `msg_${Date.now()}`;
    const startTime = Date.now();

    // Save user message
    await this.conversationService.addMessage(conversationId, {
      role: 'user',
      content: message,
    });

    // Get context
    const conversation = await this.conversationService.getConversation(conversationId);
    const financialContext = await this.contextService.buildFinancialContext(context);

    // Build prompt
    const systemPrompt = this.buildSystemPrompt(financialContext);
    const messages = this.buildMessageHistory(conversation.messages);

    // Get response from Gemini
    const response = await this.geminiService.chat(systemPrompt, messages, message);

    // Generate suggested actions
    const suggestedActions = await this.generateSuggestedActions(message, response.text);

    // Save assistant message
    await this.conversationService.addMessage(conversationId, {
      role: 'assistant',
      content: response.text,
      citations: response.citations || [],
      suggestedActions,
    });

    return {
      message_id: messageId,
      content: response.text,
      citations: response.citations || [],
      suggested_actions: suggestedActions,
      tokens_used: response.tokensUsed,
      processing_time_ms: Date.now() - startTime,
    };
  }

  async getSuggestions(context: string, limit: number) {
    const suggestions = await this.geminiService.generateSuggestions(context);
    return {
      suggestions: suggestions.slice(0, limit),
    };
  }

  async analyzeData(analyzeDto: any) {
    const { data_type, data, question } = analyzeDto;

    const prompt = `Analyze the following ${data_type} data and answer this question: ${question}

Data:
${JSON.stringify(data, null, 2)}

Provide a clear, concise analysis with specific insights and recommendations.`;

    const response = await this.geminiService.generate(prompt);

    return {
      analysis: response.text,
      data_type,
      question,
      generated_at: new Date().toISOString(),
    };
  }

  private buildSystemPrompt(context: any): string {
    return `You are an expert Financial Planning & Analysis (FP&A) AI assistant for Project Aether, an enterprise financial analytics platform.

Your role is to:
1. Provide accurate, data-driven financial insights
2. Explain variances and anomalies in financial metrics
3. Suggest actionable recommendations based on the data
4. Help users understand complex financial concepts
5. Support scenario planning and forecasting

Current Financial Context:
${JSON.stringify(context, null, 2)}

Guidelines:
- Always cite specific data points when making claims
- Use clear, professional language
- Provide specific numbers and percentages when available
- Suggest next steps or actions when appropriate
- If you don't have enough data, ask clarifying questions
- Format responses with markdown for readability

Remember: You are assisting finance professionals, so maintain accuracy and precision.`;
  }

  private buildMessageHistory(messages: any[]): Array<{ role: string; content: string }> {
    return messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  private async generateSuggestedActions(
    question: string,
    response: string,
  ): Promise<Array<{ type: string; label: string; url: string }>> {
    // Generate contextual actions based on the conversation
    const actions: Array<{ type: string; label: string; url: string }> = [];

    // Simple keyword-based action suggestions
    const lowerQuestion = question.toLowerCase();
    const lowerResponse = response.toLowerCase();

    if (lowerQuestion.includes('revenue') || lowerResponse.includes('revenue')) {
      actions.push({
        type: 'drill_down',
        label: 'View Revenue Details',
        url: '/revenue/overview',
      });
    }

    if (lowerQuestion.includes('cost') || lowerQuestion.includes('expense') ||
        lowerResponse.includes('cost') || lowerResponse.includes('expense')) {
      actions.push({
        type: 'drill_down',
        label: 'View Cost Analysis',
        url: '/cost/overview',
      });
    }

    if (lowerQuestion.includes('pipeline') || lowerQuestion.includes('deal') ||
        lowerResponse.includes('pipeline') || lowerResponse.includes('deal')) {
      actions.push({
        type: 'drill_down',
        label: 'View Sales Pipeline',
        url: '/sales/pipeline',
      });
    }

    if (lowerQuestion.includes('scenario') || lowerQuestion.includes('forecast') ||
        lowerResponse.includes('scenario') || lowerResponse.includes('forecast')) {
      actions.push({
        type: 'scenario',
        label: 'Create Scenario',
        url: '/scenarios/new',
      });
    }

    return actions.slice(0, 3);
  }
}
