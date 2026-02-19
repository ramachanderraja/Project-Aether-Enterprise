import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { DataService } from './data.service';

@ApiTags('Data')
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all CSV datasets in one response' })
  getAll() {
    return this.dataService.getAllData();
  }

  @Public()
  @Get('closed-acv')
  @ApiOperation({ summary: 'Get parsed closed ACV records' })
  getClosedAcv() {
    return this.dataService.getClosedAcv();
  }

  @Public()
  @Get('pipeline-snapshots')
  @ApiOperation({ summary: 'Get parsed monthly pipeline snapshots' })
  getPipelineSnapshots() {
    return this.dataService.getPipelineSnapshots();
  }

  @Public()
  @Get('arr-snapshots')
  @ApiOperation({ summary: 'Get parsed monthly ARR snapshots' })
  getArrSnapshots() {
    return this.dataService.getArrSnapshots();
  }

  @Public()
  @Get('sales-team')
  @ApiOperation({ summary: 'Get parsed sales team structure' })
  getSalesTeam() {
    return this.dataService.getSalesTeam();
  }

  @Public()
  @Get('customer-name-mappings')
  @ApiOperation({ summary: 'Get customer name mappings' })
  getCustomerNameMappings() {
    return this.dataService.getCustomerNameMappings();
  }

  @Public()
  @Get('sow-mappings')
  @ApiOperation({ summary: 'Get SOW mapping records' })
  getSowMappings() {
    return this.dataService.getSowMappings();
  }

  @Public()
  @Get('arr-subcategory-breakdown')
  @ApiOperation({ summary: 'Get ARR sub-category breakdown' })
  getArrSubCategoryBreakdown() {
    return this.dataService.getArrSubCategoryBreakdown();
  }

  @Public()
  @Get('product-category-mapping')
  @ApiOperation({ summary: 'Get product category mappings' })
  getProductCategoryMapping() {
    return this.dataService.getProductCategoryMapping();
  }
}
