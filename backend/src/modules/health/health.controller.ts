import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { PrometheusService } from '../../common/metrics/prometheus.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheusService: PrometheusService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'unknown',
        memory: 'unknown',
      },
    };

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.checks.database = 'healthy';
    } catch (error) {
      checks.checks.database = 'unhealthy';
      checks.status = 'unhealthy';
    }

    // Memory check
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    checks.checks.memory = heapUsedMB < heapTotalMB * 0.9 ? 'healthy' : 'warning';

    return checks;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus formatted metrics' })
  async prometheusMetrics(@Res() res: Response) {
    const metrics = await this.prometheusService.getMetrics();
    res.set('Content-Type', this.prometheusService.getContentType());
    res.send(metrics);
  }

  @Get('metrics/json')
  @ApiOperation({ summary: 'JSON metrics endpoint for monitoring' })
  async metrics() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      uptime_seconds: Math.round(uptime),
      memory: {
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };
  }
}
