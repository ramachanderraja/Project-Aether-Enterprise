import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingService } from './training.service';
import {
  GetModulesQueryDto,
  CompleteModuleDto,
} from './dto/training.dto';

@ApiTags('Training')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('modules')
  @ApiOperation({ summary: 'Get all training modules' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (fundamentals, modules, advanced)' })
  @ApiResponse({ status: 200, description: 'Training modules retrieved' })
  async getModules(
    @Request() req: { user: { sub: string } },
    @Query() query: GetModulesQueryDto,
  ) {
    return this.trainingService.getTrainingModules(req.user.sub, query.category);
  }

  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get training module details' })
  @ApiParam({ name: 'moduleId', description: 'Module ID or slug' })
  @ApiResponse({ status: 200, description: 'Module details retrieved' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleDetails(
    @Request() req: { user: { sub: string } },
    @Param('moduleId') moduleId: string,
  ) {
    return this.trainingService.getModuleDetails(moduleId, req.user.sub);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user training progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved' })
  async getProgress(@Request() req: { user: { sub: string } }) {
    return this.trainingService.getUserProgress(req.user.sub);
  }

  @Post('modules/:moduleId/complete')
  @ApiOperation({ summary: 'Mark module as completed' })
  @ApiParam({ name: 'moduleId', description: 'Module ID or slug' })
  @ApiResponse({ status: 200, description: 'Module marked complete' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async completeModule(
    @Request() req: { user: { sub: string } },
    @Param('moduleId') moduleId: string,
    @Body() body: CompleteModuleDto,
  ) {
    return this.trainingService.markModuleComplete(
      moduleId,
      req.user.sub,
      body.timeSpentMin,
    );
  }

  @Delete('modules/:moduleId/complete')
  @ApiOperation({ summary: 'Uncomplete a module (remove completion)' })
  @ApiParam({ name: 'moduleId', description: 'Module ID or slug' })
  @ApiResponse({ status: 200, description: 'Module completion removed' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async uncompleteModule(
    @Request() req: { user: { sub: string } },
    @Param('moduleId') moduleId: string,
  ) {
    return this.trainingService.uncompleteModule(moduleId, req.user.sub);
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Get user certificates and progress' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved' })
  async getCertificates(@Request() req: { user: { sub: string } }) {
    return this.trainingService.getUserCertificates(req.user.sub);
  }
}
