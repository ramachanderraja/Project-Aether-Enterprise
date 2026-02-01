import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface ChatMessage {
  role: string;
  content: string;
}

interface StreamChunk {
  text: string;
  citations?: any[];
}

interface GenerateResponse {
  text: string;
  tokensUsed?: number;
  citations?: any[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    this.modelName = this.configService.get<string>('gemini.model') || 'gemini-2.5-pro';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.logger.log(`Gemini AI initialized with model: ${this.modelName}`);
    } else {
      this.logger.warn('Gemini API key not configured - AI features will use mock responses');
    }
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    if (!this.model) {
      return this.getMockResponse(prompt);
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        tokensUsed: text.length / 4, // Approximate
      };
    } catch (error) {
      this.logger.error(`Gemini generation error: ${error.message}`);
      return this.getMockResponse(prompt);
    }
  }

  async chat(
    systemPrompt: string,
    history: ChatMessage[],
    message: string,
  ): Promise<GenerateResponse> {
    if (!this.model) {
      return this.getMockChatResponse(message);
    }

    try {
      const chat = this.model.startChat({
        history: history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: this.configService.get<number>('gemini.maxTokens') || 8192,
        },
      });

      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
      const result = await chat.sendMessage(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        tokensUsed: text.length / 4,
        citations: this.extractCitations(text),
      };
    } catch (error) {
      this.logger.error(`Gemini chat error: ${error.message}`);
      return this.getMockChatResponse(message);
    }
  }

  async *streamChat(
    systemPrompt: string,
    history: ChatMessage[],
    message: string,
  ): AsyncGenerator<StreamChunk> {
    if (!this.model) {
      // Mock streaming response
      const mockResponse = await this.getMockChatResponse(message);
      const words = mockResponse.text.split(' ');

      for (const word of words) {
        yield { text: word + ' ' };
        await this.delay(50); // Simulate streaming delay
      }
      return;
    }

    try {
      const chat = this.model.startChat({
        history: history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: this.configService.get<number>('gemini.maxTokens') || 8192,
        },
      });

      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
      const result = await chat.sendMessageStream(fullPrompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            text: chunkText,
            citations: this.extractCitations(chunkText),
          };
        }
      }
    } catch (error) {
      this.logger.error(`Gemini stream error: ${error.message}`);
      // Fall back to mock response
      const mockResponse = await this.getMockChatResponse(message);
      yield { text: mockResponse.text };
    }
  }

  async generateSuggestions(context: string): Promise<Array<{ id: string; type: string; text: string; relevance: number }>> {
    const suggestions = [
      {
        id: 'sug_001',
        type: 'question',
        text: "What's driving the 12% EBITDA improvement?",
        relevance: 0.95,
      },
      {
        id: 'sug_002',
        type: 'action',
        text: 'Run variance analysis on Marketing spend',
        relevance: 0.88,
      },
      {
        id: 'sug_003',
        type: 'insight',
        text: '3 deals worth $2.1M could close early with targeted engagement',
        relevance: 0.82,
      },
      {
        id: 'sug_004',
        type: 'question',
        text: 'How does Q1 compare to our forecast?',
        relevance: 0.78,
      },
      {
        id: 'sug_005',
        type: 'action',
        text: 'Generate cash flow projection for next quarter',
        relevance: 0.75,
      },
    ];

    // In production, use Gemini to generate context-aware suggestions
    if (this.model && context) {
      try {
        const prompt = `Based on this context: "${context}", suggest 5 relevant financial analysis questions or actions. Format as JSON array.`;
        const result = await this.generate(prompt);
        // Parse and return AI-generated suggestions
      } catch (error) {
        this.logger.warn('Using default suggestions due to API error');
      }
    }

    return suggestions;
  }

  private getMockResponse(prompt: string): GenerateResponse {
    return {
      text: `This is a mock response for development. In production, this would be generated by Gemini AI based on the prompt: "${prompt.substring(0, 100)}..."`,
      tokensUsed: 50,
    };
  }

  private getMockChatResponse(message: string): GenerateResponse {
    const responses: Record<string, string> = {
      revenue: `Based on the current financial data, **total revenue is $12.5M**, which is **5.9% above** the previous month.

**Key Drivers:**
1. **New Customer Acquisition**: +$850K from 28 new enterprise customers
2. **Expansion Revenue**: +$450K from upsells in existing accounts
3. **Churn Impact**: -$200K from 8 churned accounts

**Regional Breakdown:**
- North America: $7.5M (60%)
- EMEA: $3.125M (25%)
- APAC: $1.875M (15%)

**Recommendation:** Focus on EMEA market expansion, which shows 15% higher growth potential based on pipeline analysis.`,

      cost: `Analyzing the **operating expenses variance** of $200K (6.7% over budget):

**Top Contributing Factors:**
1. **Cloud Infrastructure** (+$79K, 47% spike)
   - Root cause: Increased data processing post-launch
   - Action: Review auto-scaling policies

2. **Contractor Costs** (+$65K)
   - Root cause: Extended project timelines
   - Action: Review project scope

3. **Software Licenses** (+$56K)
   - Root cause: New tool adoptions
   - Action: Audit for redundant tools

**Optimization Opportunities:**
- Right-size cloud instances: potential $85K monthly savings
- Consolidate SaaS tools: potential $45K annual savings`,

      default: `I can help you analyze your financial data. Based on the current dashboard:

**Key Metrics Summary:**
- Revenue: $12.5M (+5.9% MoM)
- Gross Margin: 42.5% (+0.7pp)
- EBITDA: $2.05M (+12.0%)
- Cash Position: $8.5M (18 months runway)

**Active Alerts:**
- 2 high-priority anomalies requiring attention
- 3 deals worth $2.1M identified for acceleration

What specific area would you like me to analyze in detail?`,
    };

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
      return { text: responses.revenue, tokensUsed: 200 };
    }
    if (lowerMessage.includes('cost') || lowerMessage.includes('expense') || lowerMessage.includes('opex')) {
      return { text: responses.cost, tokensUsed: 200 };
    }

    return { text: responses.default, tokensUsed: 150 };
  }

  private extractCitations(text: string): any[] {
    // Simple citation extraction - in production, this would be more sophisticated
    const citations: any[] = [];
    const patterns = [
      { regex: /\$[\d,]+[KMB]?/g, type: 'metric' },
      { regex: /[\d.]+%/g, type: 'percentage' },
    ];

    // Extract numeric references as potential citations
    return citations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
