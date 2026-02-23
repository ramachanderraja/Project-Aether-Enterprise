export type AgUiEventType =
  | 'log'
  | 'answer'
  | 'thought'
  | 'action'
  | 'observation'
  | 'error'
  | 'done'
  | 'ping'
  | 'route';

export interface AgUiEvent {
  type: AgUiEventType;
  content: string;
  data?: any;
  toolName?: string;
  toolId?: string;
  toolStatus?: string;
  metadata?: Record<string, unknown>;
}
