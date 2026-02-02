import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { ImportOptionsDto, ImportResultDto, ValidationResultDto } from './dto';

@Controller('api/v1/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // ============================================
  // FILE UPLOAD ENDPOINTS
  // ============================================

  @Post('cost-centers')
  @UseInterceptors(FileInterceptor('file'))
  async importCostCenters(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importCostCenters(csvContent, tenantId, options);
  }

  @Post('vendors')
  @UseInterceptors(FileInterceptor('file'))
  async importVendors(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importVendors(csvContent, tenantId, options);
  }

  @Post('financial-metrics')
  @UseInterceptors(FileInterceptor('file'))
  async importFinancialMetrics(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importFinancialMetrics(csvContent, tenantId, options);
  }

  @Post('costs')
  @UseInterceptors(FileInterceptor('file'))
  async importCosts(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importCosts(csvContent, tenantId, options);
  }

  @Post('deals')
  @UseInterceptors(FileInterceptor('file'))
  async importDeals(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importDeals(csvContent, tenantId, options);
  }

  @Post('deal-stage-history')
  @UseInterceptors(FileInterceptor('file'))
  async importDealStageHistory(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importDealStageHistory(csvContent, tenantId, options);
  }

  @Post('anomalies')
  @UseInterceptors(FileInterceptor('file'))
  async importAnomalies(
    @UploadedFile() file: Express.Multer.File,
    @Query() options: ImportOptionsDto,
    @Req() req: any,
  ): Promise<ImportResultDto> {
    this.validateFile(file);
    const tenantId = options.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importAnomalies(csvContent, tenantId, options);
  }

  // ============================================
  // VALIDATION ENDPOINTS
  // ============================================

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateImport(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: string,
    @Req() req: any,
  ): Promise<ValidationResultDto> {
    this.validateFile(file);
    if (!entityType) throw new BadRequestException('entityType query parameter is required');

    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.validateImport(csvContent, entityType, tenantId);
  }

  // ============================================
  // BULK IMPORT (JSON)
  // ============================================

  @Post('bulk/cost-centers')
  async bulkImportCostCenters(
    @Body() body: { data: string; options?: ImportOptionsDto },
    @Req() req: any,
  ): Promise<ImportResultDto> {
    const tenantId = body.options?.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    return this.importService.importCostCenters(body.data, tenantId, body.options);
  }

  @Post('bulk/financial-metrics')
  async bulkImportFinancialMetrics(
    @Body() body: { data: string; options?: ImportOptionsDto },
    @Req() req: any,
  ): Promise<ImportResultDto> {
    const tenantId = body.options?.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    return this.importService.importFinancialMetrics(body.data, tenantId, body.options);
  }

  // ============================================
  // HELPERS
  // ============================================

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }
  }
}
