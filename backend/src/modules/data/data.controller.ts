import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataService } from './data.service';

@ApiTags('Data')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all CSV datasets in one response' })
  getAll() {
    return this.dataService.getAllData();
  }

  @Get('closed-acv')
  @ApiOperation({ summary: 'Get parsed closed ACV records' })
  getClosedAcv() {
    return this.dataService.getClosedAcv();
  }

  @Get('pipeline-snapshots')
  @ApiOperation({ summary: 'Get parsed monthly pipeline snapshots' })
  getPipelineSnapshots() {
    return this.dataService.getPipelineSnapshots();
  }

  @Get('arr-snapshots')
  @ApiOperation({ summary: 'Get parsed monthly ARR snapshots' })
  getArrSnapshots() {
    return this.dataService.getArrSnapshots();
  }

  @Get('sales-team')
  @ApiOperation({ summary: 'Get parsed sales team structure' })
  getSalesTeam() {
    return this.dataService.getSalesTeam();
  }

  @Get('customer-name-mappings')
  @ApiOperation({ summary: 'Get customer name mappings' })
  getCustomerNameMappings() {
    return this.dataService.getCustomerNameMappings();
  }

  @Get('sow-mappings')
  @ApiOperation({ summary: 'Get SOW mapping records' })
  getSowMappings() {
    return this.dataService.getSowMappings();
  }

  @Get('arr-subcategory-breakdown')
  @ApiOperation({ summary: 'Get ARR sub-category breakdown' })
  getArrSubCategoryBreakdown() {
    return this.dataService.getArrSubCategoryBreakdown();
  }

  @Get('product-category-mapping')
  @ApiOperation({ summary: 'Get product category mappings' })
  getProductCategoryMapping() {
    return this.dataService.getProductCategoryMapping();
  }
}
