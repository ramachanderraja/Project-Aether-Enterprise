import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateConversationDto } from '../dto';

@Injectable()
export class ConversationService {
  // In-memory store for demo - in production use database
  private conversations: Map<string, any> = new Map();
  private messages: Map<string, any[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async createConversation(
    userId: string,
    tenantId: string,
    createDto: CreateConversationDto,
  ) {
    const conversationId = `conv_${Date.now()}`;

    const conversation = {
      id: conversationId,
      user_id: userId,
      tenant_id: tenantId,
      context: createDto.context,
      metadata: createDto.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);

    // If there's an initial message, add it
    if (createDto.initial_message) {
      await this.addMessage(conversationId, {
        role: 'user',
        content: createDto.initial_message,
      });
    }

    // In production, save to database
    // await this.prisma.aIConversation.create({...})

    return {
      conversation_id: conversationId,
      created_at: conversation.created_at,
      status: 'active',
    };
  }

  async getUserConversations(userId: string, limit: number) {
    // Filter conversations by user
    const userConversations: any[] = [];

    this.conversations.forEach((conv) => {
      if (conv.user_id === userId) {
        const messages = this.messages.get(conv.id) || [];
        userConversations.push({
          ...conv,
          message_count: messages.length,
          last_message: messages[messages.length - 1]?.content?.substring(0, 100),
        });
      }
    });

    // Sort by updated_at descending
    userConversations.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    return {
      conversations: userConversations.slice(0, limit),
      total: userConversations.length,
    };
  }

  async getConversation(conversationId: string) {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const messages = this.messages.get(conversationId) || [];

    return {
      ...conversation,
      messages,
    };
  }

  async getMessages(conversationId: string) {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const messages = this.messages.get(conversationId) || [];

    return {
      conversation_id: conversationId,
      messages,
    };
  }

  async addMessage(
    conversationId: string,
    message: {
      role: string;
      content: string;
      citations?: any[];
      suggestedActions?: any[];
    },
  ) {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newMessage = {
      id: messageId,
      role: message.role,
      content: message.content,
      citations: message.citations || [],
      suggested_actions: message.suggestedActions || [],
      timestamp: new Date().toISOString(),
    };

    const messages = this.messages.get(conversationId) || [];
    messages.push(newMessage);
    this.messages.set(conversationId, messages);

    // Update conversation timestamp
    conversation.updated_at = new Date().toISOString();
    this.conversations.set(conversationId, conversation);

    return newMessage;
  }

  async deleteConversation(conversationId: string) {
    const exists = this.conversations.has(conversationId);

    if (!exists) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);

    return { deleted: true };
  }
}
