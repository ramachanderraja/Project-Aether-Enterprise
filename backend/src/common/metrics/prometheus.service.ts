import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private register: client.Registry;

  // Counters
  private httpRequestsTotal: client.Counter<string>;
  private httpRequestErrorsTotal: client.Counter<string>;
  private authenticationAttempts: client.Counter<string>;
  private aiChatMessages: client.Counter<string>;

  // Histograms
  private httpRequestDuration: client.Histogram<string>;
  private databaseQueryDuration: client.Histogram<string>;
  private aiResponseTime: client.Histogram<string>;

  // Gauges
  private activeConnections: client.Gauge<string>;
  private cacheHitRatio: client.Gauge<string>;
  private memoryUsage: client.Gauge<string>;
  private cpuUsage: client.Gauge<string>;

  constructor() {
    this.register = new client.Registry();

    // Add default metrics (process CPU, memory, etc.)
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'aether_',
    });

    this.initializeMetrics();
  }

  onModuleInit() {
    // Start collecting system metrics periodically
    this.startSystemMetricsCollection();
  }

  private initializeMetrics() {
    // HTTP Request Counter
    this.httpRequestsTotal = new client.Counter({
      name: 'aether_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.register],
    });

    // HTTP Request Errors Counter
    this.httpRequestErrorsTotal = new client.Counter({
      name: 'aether_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'path', 'status', 'error_type'],
      registers: [this.register],
    });

    // Authentication Attempts Counter
    this.authenticationAttempts = new client.Counter({
      name: 'aether_authentication_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'status'],
      registers: [this.register],
    });

    // AI Chat Messages Counter
    this.aiChatMessages = new client.Counter({
      name: 'aether_ai_chat_messages_total',
      help: 'Total number of AI chat messages',
      labelNames: ['status'],
      registers: [this.register],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new client.Histogram({
      name: 'aether_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    // Database Query Duration Histogram
    this.databaseQueryDuration = new client.Histogram({
      name: 'aether_database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register],
    });

    // AI Response Time Histogram
    this.aiResponseTime = new client.Histogram({
      name: 'aether_ai_response_duration_seconds',
      help: 'AI response generation duration in seconds',
      labelNames: ['model'],
      buckets: [0.5, 1, 2.5, 5, 10, 25, 50, 100],
      registers: [this.register],
    });

    // Active Connections Gauge
    this.activeConnections = new client.Gauge({
      name: 'aether_active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.register],
    });

    // Cache Hit Ratio Gauge
    this.cacheHitRatio = new client.Gauge({
      name: 'aether_cache_hit_ratio',
      help: 'Cache hit ratio',
      registers: [this.register],
    });

    // Memory Usage Gauge
    this.memoryUsage = new client.Gauge({
      name: 'aether_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register],
    });

    // CPU Usage Gauge
    this.cpuUsage = new client.Gauge({
      name: 'aether_cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.register],
    });
  }

  private startSystemMetricsCollection() {
    // Collect system metrics every 5 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);

      const cpuUsage = process.cpuUsage();
      this.cpuUsage.set((cpuUsage.user + cpuUsage.system) / 1000000);
    }, 5000);
  }

  // HTTP metrics
  recordHttpRequest(method: string, path: string, status: number, duration: number) {
    const labels = { method, path: this.normalizePath(path), status: String(status) };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, duration / 1000); // Convert ms to seconds

    if (status >= 400) {
      this.httpRequestErrorsTotal.inc({
        ...labels,
        error_type: status >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  // Authentication metrics
  recordAuthAttempt(type: 'login' | 'register' | 'refresh' | 'mfa', success: boolean) {
    this.authenticationAttempts.inc({
      type,
      status: success ? 'success' : 'failure',
    });
  }

  // AI metrics
  recordAiMessage(success: boolean) {
    this.aiChatMessages.inc({ status: success ? 'success' : 'failure' });
  }

  recordAiResponseTime(model: string, duration: number) {
    this.aiResponseTime.observe({ model }, duration / 1000);
  }

  // Database metrics
  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.observe(
      { operation, table },
      duration / 1000,
    );
  }

  // Connection metrics
  setActiveConnections(type: 'http' | 'websocket' | 'database', count: number) {
    this.activeConnections.set({ type }, count);
  }

  // Cache metrics
  setCacheHitRatio(ratio: number) {
    this.cacheHitRatio.set(ratio);
  }

  // Normalize path for metrics (replace dynamic segments)
  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.+$/, '');
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get content type for Prometheus
  getContentType(): string {
    return this.register.contentType;
  }
}
