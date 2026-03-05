import { Controller, Post, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HubspotSyncService } from './hubspot-sync.service';

@ApiTags('hubspot')
@Controller('hubspot')
export class HubspotController {
  private readonly logger = new Logger(HubspotController.name);

  constructor(private readonly syncService: HubspotSyncService) {}

  @Post('sync/current-month')
  @ApiOperation({ summary: 'Manually trigger current month pipeline sync' })
  async syncCurrentMonth() {
    this.logger.log('Manual trigger: current month sync');
    const result = await this.syncService.syncCurrentMonth();
    return result;
  }

  @Post('sync/historical-stages')
  @ApiOperation({ summary: 'Manually trigger historical stage update' })
  async syncHistoricalStages() {
    this.logger.log('Manual trigger: historical stage update');
    const result = await this.syncService.updateHistoricalStages();
    return result;
  }

  @Get('sync/logs')
  @ApiOperation({ summary: 'View sync history' })
  async getSyncLogs(@Query('limit') limit?: string) {
    const parsedLimit = parseInt(limit || '20', 10);
    return this.syncService.getSyncLogs(parsedLimit);
  }

  @Get('sync/status')
  @ApiOperation({ summary: 'Check if sync is currently running' })
  async getSyncStatus() {
    return {
      running: this.syncService.isSyncRunning(),
      timestamp: new Date().toISOString(),
    };
  }
}
