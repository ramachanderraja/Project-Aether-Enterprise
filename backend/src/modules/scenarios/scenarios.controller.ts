import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScenariosService } from './scenarios.service';
import {
  CreateScenarioDto,
  UpdateScenarioDto,
  GetScenariosDto,
  RunSimulationDto,
  CompareScenarioDto,
  SensitivityAnalysisDto,
  ApproveScenarioDto,
} from './dto';

@ApiTags('Scenarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scenarios with filtering' })
  @ApiResponse({ status: 200, description: 'List of scenarios' })
  async getScenarios(@Query() query: GetScenariosDto) {
    return this.scenariosService.getScenarios(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scenario by ID' })
  @ApiParam({ name: 'id', description: 'Scenario ID' })
  @ApiResponse({ status: 200, description: 'Scenario details' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  async getScenarioById(@Param('id') id: string) {
    return this.scenariosService.getScenarioById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new scenario' })
  @ApiResponse({ status: 201, description: 'Scenario created' })
  async createScenario(@Body() dto: CreateScenarioDto, @Request() req) {
    return this.scenariosService.createScenario(dto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update scenario' })
  @ApiParam({ name: 'id', description: 'Scenario ID' })
  @ApiResponse({ status: 200, description: 'Scenario updated' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  async updateScenario(@Param('id') id: string, @Body() dto: UpdateScenarioDto) {
    return this.scenariosService.updateScenario(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scenario' })
  @ApiParam({ name: 'id', description: 'Scenario ID' })
  @ApiResponse({ status: 204, description: 'Scenario deleted' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  async deleteScenario(@Param('id') id: string) {
    return this.scenariosService.deleteScenario(id);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Run Monte Carlo simulation on scenario' })
  @ApiResponse({ status: 200, description: 'Simulation results' })
  async runSimulation(@Body() dto: RunSimulationDto) {
    return this.scenariosService.runSimulation(dto);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple scenarios' })
  @ApiResponse({ status: 200, description: 'Comparison results' })
  async compareScenarios(@Body() dto: CompareScenarioDto) {
    return this.scenariosService.compareScenarios(dto);
  }

  @Post('sensitivity')
  @ApiOperation({ summary: 'Run sensitivity analysis' })
  @ApiResponse({ status: 200, description: 'Sensitivity analysis results with tornado chart data' })
  async runSensitivityAnalysis(@Body() dto: SensitivityAnalysisDto) {
    return this.scenariosService.runSensitivityAnalysis(dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve scenario' })
  @ApiParam({ name: 'id', description: 'Scenario ID' })
  @ApiResponse({ status: 200, description: 'Scenario approved' })
  @ApiResponse({ status: 400, description: 'Invalid scenario state' })
  async approveScenario(
    @Param('id') id: string,
    @Body() dto: ApproveScenarioDto,
    @Request() req,
  ) {
    return this.scenariosService.approveScenario(id, dto, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get scenario version history' })
  @ApiParam({ name: 'id', description: 'Scenario ID' })
  @ApiResponse({ status: 200, description: 'Version history' })
  async getScenarioVersions(@Param('id') id: string) {
    return this.scenariosService.getScenarioVersions(id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone an existing scenario' })
  @ApiParam({ name: 'id', description: 'Source scenario ID' })
  @ApiResponse({ status: 201, description: 'Cloned scenario' })
  async cloneScenario(
    @Param('id') id: string,
    @Body('name') name: string,
    @Request() req,
  ) {
    return this.scenariosService.cloneScenario(id, name, req.user.id);
  }
}
