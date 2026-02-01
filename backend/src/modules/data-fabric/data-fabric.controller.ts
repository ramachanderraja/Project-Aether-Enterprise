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
import { DataFabricService } from './data-fabric.service';
import {
  CreateDataSourceDto,
  UpdateDataSourceDto,
  CreateDataMappingDto,
  RunSyncDto,
  GetSyncHistoryDto,
  DataQualityCheckDto,
  QueryDataDto,
} from './dto';

@ApiTags('Data Fabric')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data-fabric')
export class DataFabricController {
  constructor(private readonly dataFabricService: DataFabricService) {}

  // Data Sources
  @Get('sources')
  @ApiOperation({ summary: 'Get all data sources' })
  @ApiResponse({ status: 200, description: 'List of data sources' })
  async getDataSources() {
    return this.dataFabricService.getDataSources();
  }

  @Get('sources/:id')
  @ApiOperation({ summary: 'Get data source by ID' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 200, description: 'Data source details' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async getDataSourceById(@Param('id') id: string) {
    return this.dataFabricService.getDataSourceById(id);
  }

  @Post('sources')
  @ApiOperation({ summary: 'Create a new data source' })
  @ApiResponse({ status: 201, description: 'Data source created' })
  async createDataSource(@Body() dto: CreateDataSourceDto) {
    return this.dataFabricService.createDataSource(dto);
  }

  @Put('sources/:id')
  @ApiOperation({ summary: 'Update data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 200, description: 'Data source updated' })
  async updateDataSource(@Param('id') id: string, @Body() dto: UpdateDataSourceDto) {
    return this.dataFabricService.updateDataSource(id, dto);
  }

  @Delete('sources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 204, description: 'Data source deleted' })
  async deleteDataSource(@Param('id') id: string) {
    return this.dataFabricService.deleteDataSource(id);
  }

  @Post('sources/:id/test')
  @ApiOperation({ summary: 'Test data source connection' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection(@Param('id') id: string) {
    return this.dataFabricService.testConnection(id);
  }

  // Data Mappings
  @Get('mappings')
  @ApiOperation({ summary: 'Get all data mappings' })
  @ApiResponse({ status: 200, description: 'List of data mappings' })
  async getDataMappings(@Query('source_id') sourceId?: string) {
    return this.dataFabricService.getDataMappings(sourceId);
  }

  @Get('mappings/:id')
  @ApiOperation({ summary: 'Get mapping by ID' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({ status: 200, description: 'Mapping details' })
  async getMappingById(@Param('id') id: string) {
    return this.dataFabricService.getMappingById(id);
  }

  @Post('mappings')
  @ApiOperation({ summary: 'Create a new data mapping' })
  @ApiResponse({ status: 201, description: 'Mapping created' })
  async createDataMapping(@Body() dto: CreateDataMappingDto) {
    return this.dataFabricService.createDataMapping(dto);
  }

  @Delete('mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete data mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  @ApiResponse({ status: 204, description: 'Mapping deleted' })
  async deleteDataMapping(@Param('id') id: string) {
    return this.dataFabricService.deleteDataMapping(id);
  }

  // Sync Operations
  @Post('sync')
  @ApiOperation({ summary: 'Trigger data sync' })
  @ApiResponse({ status: 201, description: 'Sync job started' })
  async runSync(@Body() dto: RunSyncDto) {
    return this.dataFabricService.runSync(dto);
  }

  @Get('sync/history')
  @ApiOperation({ summary: 'Get sync history' })
  @ApiResponse({ status: 200, description: 'Sync history' })
  async getSyncHistory(@Query() query: GetSyncHistoryDto) {
    return this.dataFabricService.getSyncHistory(query);
  }

  @Get('sync/:id')
  @ApiOperation({ summary: 'Get sync job status' })
  @ApiParam({ name: 'id', description: 'Sync job ID' })
  @ApiResponse({ status: 200, description: 'Sync job details' })
  async getSyncJobById(@Param('id') id: string) {
    return this.dataFabricService.getSyncJobById(id);
  }

  // Data Quality
  @Post('quality/check')
  @ApiOperation({ summary: 'Run data quality check' })
  @ApiResponse({ status: 200, description: 'Quality check results' })
  async runDataQualityCheck(@Body() dto: DataQualityCheckDto) {
    return this.dataFabricService.runDataQualityCheck(dto);
  }

  // Data Query
  @Post('query')
  @ApiOperation({ summary: 'Query unified data' })
  @ApiResponse({ status: 200, description: 'Query results' })
  async queryData(@Body() dto: QueryDataDto) {
    return this.dataFabricService.queryData(dto);
  }

  // Data Catalog
  @Get('catalog')
  @ApiOperation({ summary: 'Get data catalog' })
  @ApiResponse({ status: 200, description: 'Data catalog with entities and relationships' })
  async getDataCatalog() {
    return this.dataFabricService.getDataCatalog();
  }
}
