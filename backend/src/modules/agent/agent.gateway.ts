import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { AgentService } from './agent.service';
import type { AgUiEvent } from './streaming/agui-events';

type ChatStartPayload = {
  agentKey: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
};

@WebSocketGateway({
  namespace: '/agent',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AgentGateway {
  private readonly logger = new Logger(AgentGateway.name);
  private readonly abortBySocketId = new Map<string, AbortController>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly agentService: AgentService) {}

  handleDisconnect(client: Socket) {
    const abort = this.abortBySocketId.get(client.id);
    if (abort) abort.abort();
    this.abortBySocketId.delete(client.id);
  }

  @SubscribeMessage('chat:start')
  async handleChatStart(
    @MessageBody() body: ChatStartPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Abort any in-flight stream for this socket
    const prev = this.abortBySocketId.get(client.id);
    if (prev) prev.abort();

    const abort = new AbortController();
    this.abortBySocketId.set(client.id, abort);

    const userId = 'anonymous';

    try {
      const stream = this.agentService.chatStream(
        body.agentKey,
        body.message,
        userId,
        body.history,
      );

      for await (const event of stream) {
        if (abort.signal.aborted) break;
        client.emit('chat:event', event satisfies AgUiEvent);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`WS stream error: ${msg}`);
      client.emit('chat:event', { type: 'error', content: msg } satisfies AgUiEvent);
    } finally {
      client.emit('chat:done', { type: 'done', content: '' } satisfies AgUiEvent);
      this.abortBySocketId.delete(client.id);
    }
  }
}

