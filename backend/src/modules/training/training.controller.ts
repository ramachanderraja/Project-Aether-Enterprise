import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingService } from './training.service';

@ApiTags('Training')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('modules')
  @ApiOperation({ summary: 'Get all training modules' })
  @ApiResponse({ status: 200, description: 'Training modules retrieved' })
  async getModules() {
    return this.trainingService.getTrainingModules();
  }

  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get training module details' })
  @ApiResponse({ status: 200, description: 'Module details retrieved' })
  async getModuleDetails(@Param('moduleId') moduleId: string) {
    return this.trainingService.getModuleDetails(moduleId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user training progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved' })
  async getProgress() {
    return this.trainingService.getUserProgress();
  }

  @Post('modules/:moduleId/complete')
  @ApiOperation({ summary: 'Mark module as completed' })
  @ApiResponse({ status: 200, description: 'Module marked complete' })
  async completeModule(@Param('moduleId') moduleId: string) {
    return this.trainingService.markModuleComplete(moduleId);
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Get user certificates' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved' })
  async getCertificates() {
    return this.trainingService.getUserCertificates();
  }
}
