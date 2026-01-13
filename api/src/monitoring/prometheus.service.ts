import { Injectable, OnModuleInit } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly register: promClient.Registry;
  public readonly httpRequestDuration: promClient.Histogram<string>;
  public readonly httpRequestTotal: promClient.Counter<string>;
  public readonly httpRequestErrors: promClient.Counter<string>;
  public readonly databaseQueryDuration: promClient.Histogram<string>;
  public readonly databaseConnections: promClient.Gauge<string>;
  public readonly cacheHits: promClient.Counter<string>;
  public readonly cacheMisses: promClient.Counter<string>;
  public readonly activeUsers: promClient.Gauge<string>;
  public readonly activeOrganizations: promClient.Gauge<string>;
  public readonly websocketConnections: promClient.Gauge<string>;
  public readonly memoryUsage: promClient.Gauge<string>;
  public readonly cpuUsage: promClient.Gauge<string>;

  constructor() {
    // Create a Registry to register the metrics
    this.register = new promClient.Registry();

    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });

    // HTTP Metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestErrors = new promClient.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.register],
    });

    // Database Metrics
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.databaseConnections = new promClient.Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    // Cache Metrics
    this.cacheHits = new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_key'],
      registers: [this.register],
    });

    this.cacheMisses = new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_key'],
      registers: [this.register],
    });

    // Business Metrics
    this.activeUsers = new promClient.Gauge({
      name: 'active_users_total',
      help: 'Total number of active users',
      registers: [this.register],
    });

    this.activeOrganizations = new promClient.Gauge({
      name: 'active_organizations_total',
      help: 'Total number of active organizations',
      registers: [this.register],
    });

    // WebSocket Metrics
    this.websocketConnections = new promClient.Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
      registers: [this.register],
    });

    // System Metrics
    this.memoryUsage = new promClient.Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.cpuUsage = new promClient.Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Update system metrics periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.updateSystemMetrics();
      }, 5000); // Update every 5 seconds
    }
  }

  private updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
    this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
    this.memoryUsage.set({ type: 'external' }, memUsage.external);
    this.memoryUsage.set({ type: 'rss' }, memUsage.rss);

    // CPU usage (simplified - in production, use a more sophisticated method)
    const cpuUsage = process.cpuUsage();
    const totalCpu = cpuUsage.user + cpuUsage.system;
    // This is a simplified calculation
    this.cpuUsage.set(totalCpu / 1000000); // Convert to percentage approximation
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegister(): promClient.Registry {
    return this.register;
  }
}

