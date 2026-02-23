import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { ConversationService } from './services/conversation.service';
import {
  CreateConversationDto,
  SendMessageDto,
  GetSuggestionsDto,
} from './dto';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly conversationService: ConversationService,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new AI conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(
    @Request() req,
    @Body() createDto: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(
      req.user.sub,
      req.user.tenant_id,
      createDto,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  async getConversations(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    return this.conversationService.getUserConversations(
      req.user.sub,
      limit || 20,
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get conversation with messages' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  async getConversation(@Param('conversationId') conversationId: string) {
    return this.conversationService.getConversation(conversationId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.conversationService.getMessages(conversationId);
  }

  @Post('message')
  @ApiOperation({ summary: 'Send message (auto-creates or reuses conversation)' })
  @ApiResponse({ status: 200, description: 'Message sent' })
  async sendMessageSimple(
    @Request() req,
    @Body() body: { conversation_id?: string; message: string; context?: any },
  ) {
    let conversationId = body.conversation_id;

    if (!conversationId) {
      const conversation = await this.conversationService.createConversation(
        req.user.sub,
        req.user.tenant_id,
        { context: 'general', initial_message: body.message },
      );
      conversationId = conversation.conversation_id;
    }

    return this.aiService.sendMessageSync(
      conversationId,
      body.message,
      body.context,
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send message and get streaming response' })
  @ApiResponse({ status: 200, description: 'Message sent, streaming response' })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() sendDto: SendMessageDto,
    @Res() res: Response,
  ) {
    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = await this.aiService.sendMessage(
        conversationId,
        sendDto.message,
        sendDto.context,
      );

      for await (const event of stream) {
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
      }

      res.end();
    } catch (error) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    }
  }

  @Post('conversations/:conversationId/messages/sync')
  @ApiOperation({ summary: 'Send message and get non-streaming response' })
  @ApiResponse({ status: 200, description: 'Message response' })
  async sendMessageSync(
    @Param('conversationId') conversationId: string,
    @Body() sendDto: SendMessageDto,
  ) {
    return this.aiService.sendMessageSync(
      conversationId,
      sendDto.message,
      sendDto.context,
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI suggestions for current context' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved' })
  async getSuggestions(@Query() query: GetSuggestionsDto) {
    return this.aiService.getSuggestions(query.context, query.limit || 5);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze financial data with AI' })
  @ApiResponse({ status: 200, description: 'Analysis complete' })
  async analyzeData(@Body() analyzeDto: any) {
    return this.aiService.analyzeData(analyzeDto);
  }
}
