import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntelligenceService } from './intelligence.service';

@ApiTags('Intelligence')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get intelligent core overview' })
  @ApiResponse({ status: 200, description: 'Overview retrieved' })
  async getOverview() {
    return this.intelligenceService.getOverview();
  }

  @Get('models')
  @ApiOperation({ summary: 'Get active ML models registry' })
  @ApiResponse({ status: 200, description: 'Models retrieved' })
  async getModels() {
    return this.intelligenceService.getModels();
  }

  @Get('models/:modelId')
  @ApiOperation({ summary: 'Get model details' })
  @ApiResponse({ status: 200, description: 'Model details retrieved' })
  async getModelDetails(@Param('modelId') modelId: string) {
    return this.intelligenceService.getModelDetails(modelId);
  }

  @Post('models/:modelId/retrain')
  @ApiOperation({ summary: 'Trigger model retraining' })
  @ApiResponse({ status: 200, description: 'Retraining initiated' })
  async retrainModel(@Param('modelId') modelId: string) {
    return this.intelligenceService.retrainModel(modelId);
  }

  @Get('compute')
  @ApiOperation({ summary: 'Get compute resource usage' })
  @ApiResponse({ status: 200, description: 'Compute resources retrieved' })
  async getComputeResources() {
    return this.intelligenceService.getComputeResources();
  }

  @Get('latency')
  @ApiOperation({ summary: 'Get system latency metrics' })
  @ApiResponse({ status: 200, description: 'Latency metrics retrieved' })
  async getLatency(@Query('period') period?: string) {
    return this.intelligenceService.getLatencyMetrics(period);
  }

  @Get('decisions')
  @ApiOperation({ summary: 'Get autonomous decisions log' })
  @ApiResponse({ status: 200, description: 'Decisions log retrieved' })
  async getDecisions(@Query('limit') limit?: number) {
    return this.intelligenceService.getAutonomousDecisions(limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get overall system health' })
  @ApiResponse({ status: 200, description: 'System health retrieved' })
  async getHealth() {
    return this.intelligenceService.getSystemHealth();
  }
}
