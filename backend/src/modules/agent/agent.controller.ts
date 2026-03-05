import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentService } from './agent.service';
import { ChatDto } from './dto/chat.dto';

@Controller({ path: 'agent', version: '1' })
@UseGuards(JwtAuthGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Get('configs')
  getConfigs() {
    return this.agentService.listAgents();
  }

  @Post('chat')
  async chat(
    @Body(new ValidationPipe({ transform: true })) body: ChatDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub || 'anonymous';
    return this.agentService.chat(
      body.agentKey,
      body.message,
      userId,
      body.history,
    );
  }

  @Post('chat/stream')
  async chatStream(
    @Body(new ValidationPipe({ transform: true })) body: ChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = (req as any).user?.sub || 'anonymous';

    // NDJSON headers
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // Ensure the client receives an initial chunk immediately
    res.write('\n');
    (res as any).flush?.();

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      try {
        res.write(JSON.stringify({ type: 'ping', content: '' }) + '\n');
        (res as any).flush?.();
      } catch {
        clearInterval(pingInterval);
      }
    }, 15000);

    // Client disconnect handler
    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
      clearInterval(pingInterval);
    });

    try {
      const stream = this.agentService.chatStream(
        body.agentKey,
        body.message,
        userId,
        body.history,
      );

      for await (const event of stream) {
        if (abortController.signal.aborted) break;
        res.write(JSON.stringify(event) + '\n');
        (res as any).flush?.();
      }
    } catch (error) {
      this.logger.error(`Stream error: ${error}`);
      try {
        res.write(
          JSON.stringify({
            type: 'error',
            content:
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
          }) + '\n',
        );
        (res as any).flush?.();
      } catch {
        // response already closed
      }
    } finally {
      clearInterval(pingInterval);
      try {
        res.end();
      } catch {
        // already ended
      }
    }
  }
}
