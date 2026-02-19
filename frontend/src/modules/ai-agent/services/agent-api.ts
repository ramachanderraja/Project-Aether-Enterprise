import axios from 'axios';
import { useAuthStore } from '@/modules/auth/store/authStore';
import type { AgUiEvent } from '../streaming/agui-events';
import { parseNDJSONStream } from '../streaming/stream-parser';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface AgentConfig {
  key: string;
  name: string;
  description: string;
  icon: string;
  suggestedQueries: string[];
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getHeaders(): Record<string, string> {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAuth, clearAuth, user } = useAuthStore.getState();
  if (!refreshToken || !user) {
    clearAuth();
    return null;
  }
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const newToken = res.data?.data?.access_token ?? res.data?.access_token;
    if (newToken) {
      setAuth(user, newToken, refreshToken);
      return newToken;
    }
    clearAuth();
    return null;
  } catch {
    clearAuth();
    return null;
  }
}

export async function fetchAgentConfigs(): Promise<AgentConfig[]> {
  const res = await fetch(`${BASE_URL}/agent/configs`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch configs: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function* streamAgentChat(
  agentKey: string,
  message: string,
  history?: HistoryMessage[],
  signal?: AbortSignal,
): AsyncGenerator<AgUiEvent> {
  const transport =
    (import.meta.env.VITE_AGENT_STREAM_TRANSPORT as string | undefined) || 'http';

  if (transport === 'ws') {
    yield* streamAgentChatWs(agentKey, message, history, signal);
    return;
  }

  let res = await fetch(`${BASE_URL}/agent/chat/stream`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ agentKey, message, history }),
    signal,
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Session expired. Please log in again.');
    }
    res = await fetch(`${BASE_URL}/agent/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify({ agentKey, message, history }),
      signal,
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat stream failed (${res.status}): ${text}`);
  }

  yield* parseNDJSONStream(res, signal);
}

function getWsBaseUrl(): string {
  // If VITE_API_URL is absolute like http://localhost:3001/api/v1, strip /api/v1.
  if (BASE_URL.startsWith('http://') || BASE_URL.startsWith('https://')) {
    return BASE_URL.replace(/\/api\/v\d+\/?$/i, '');
  }
  // If VITE_API_URL is relative (default), use current origin.
  return window.location.origin;
}

async function* streamAgentChatWs(
  agentKey: string,
  message: string,
  history?: HistoryMessage[],
  signal?: AbortSignal,
): AsyncGenerator<AgUiEvent> {
  const wsBase = getWsBaseUrl();
  const token = getAccessToken();

  const socket = io(`${wsBase}/agent`, {
    transports: ['websocket'],
    auth: token ? { token } : {},
  });

  const queue: AgUiEvent[] = [];
  let done = false;
  let notify: (() => void) | null = null;

  const wake = () => {
    notify?.();
    notify = null;
  };

  const onEvent = (evt: AgUiEvent) => {
    queue.push(evt);
    wake();
  };

  const onDone = () => {
    done = true;
    wake();
  };

  const onConnectError = async (err: any) => {
    // If the server later adds auth validation, try refresh once.
    if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
      await refreshAccessToken().catch(() => null);
    }
    onEvent({
      type: 'error',
      content: err?.message || 'WebSocket connection failed',
    });
    done = true;
    wake();
  };

  socket.on('chat:event', onEvent);
  socket.on('chat:done', onDone);
  socket.on('connect_error', onConnectError);

  if (signal) {
    const onAbort = () => {
      done = true;
      try {
        socket.disconnect();
      } catch {
        // ignore
      }
      wake();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (e: any) => reject(e));
    });

    socket.emit('chat:start', { agentKey, message, history });

    while (!done) {
      if (signal?.aborted) break;

      if (queue.length === 0) {
        await new Promise<void>((r) => (notify = r));
        continue;
      }

      const next = queue.shift();
      if (next) yield next;
    }

    // Drain any remaining queued events
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) yield next;
    }
  } finally {
    try {
      socket.off('chat:event', onEvent);
      socket.off('chat:done', onDone);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    } catch {
      // ignore
    }
  }
}
