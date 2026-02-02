import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ImportOptionsDto,
  ImportResultDto,
  ImportErrorDto,
  ValidationResultDto,
  ImportMode,
  CostCenterImportDto,
  VendorImportDto,
  FinancialMetricImportDto,
  CostImportDto,
  DealImportDto,
  DealStageHistoryImportDto,
  AnomalyImportDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CSV PARSING
  // ============================================

  parseCSV(csvContent: string): Record<string, string>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const records: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        this.logger.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        continue;
      }

      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || '';
      });
      records.push(record);
    }

    return records;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  // ============================================
  // COST CENTERS
  // ============================================

  async importCostCenters(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // First pass: Create all cost centers without parent references
    const costCenterMap = new Map<string, string>();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // Account for header and 0-index

      try {
        const data: CostCenterImportDto = {
          code: row.code,
          name: row.name,
          parent_code: row.parent_code,
          is_active: row.is_active !== 'false',
        };

        if (!data.code || !data.name) {
          errors.push({ row: rowNum, message: 'Missing required fields: code, name' });
          skippedCount++;
          continue;
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        const costCenter = await this.prisma.costCenter.upsert({
          where: { tenantId_code: { tenantId, code: data.code } },
          create: {
            tenantId,
            code: data.code,
            name: data.name,
            isActive: data.is_active ?? true,
          },
          update: {
            name: data.name,
            isActive: data.is_active ?? true,
          },
        });

        costCenterMap.set(data.code, costCenter.id);
        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    // Second pass: Update parent references
    if (!options.validateOnly) {
      for (const row of records) {
        if (row.parent_code && costCenterMap.has(row.parent_code)) {
          await this.prisma.costCenter.update({
            where: { tenantId_code: { tenantId, code: row.code } },
            data: { parentId: costCenterMap.get(row.parent_code) },
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // VENDORS
  // ============================================

  async importVendors(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: VendorImportDto = {
          name: row.name,
          category: row.category || null,
          contract_start: row.contract_start || null,
          contract_end: row.contract_end || null,
          payment_terms: row.payment_terms || null,
          risk_score: row.risk_score || null,
          is_active: row.is_active !== 'false',
        };

        if (!data.name) {
          errors.push({ row: rowNum, message: 'Missing required field: name' });
          skippedCount++;
          continue;
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        await this.prisma.vendor.create({
          data: {
            tenantId,
            name: data.name,
            category: data.category,
            contractStart: data.contract_start ? new Date(data.contract_start) : null,
            contractEnd: data.contract_end ? new Date(data.contract_end) : null,
            paymentTerms: data.payment_terms,
            riskScore: data.risk_score,
            isActive: data.is_active ?? true,
          },
        });

        importedCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          warnings.push(`Row ${rowNum}: Vendor "${row.name}" already exists`);
          skippedCount++;
        } else {
          errors.push({ row: rowNum, message: error.message });
          if (!options.skipErrors) throw error;
          skippedCount++;
        }
      }
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // FINANCIAL METRICS
  // ============================================

  async importFinancialMetrics(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // Cache cost centers for lookup
    const costCenters = await this.prisma.costCenter.findMany({
      where: { tenantId },
      select: { id: true, code: true },
    });
    const costCenterMap = new Map(costCenters.map((cc) => [cc.code, cc.id]));

    const metricsToCreate: Prisma.FinancialMetricCreateManyInput[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: FinancialMetricImportDto = {
          metric_type: row.metric_type,
          value: parseFloat(row.value),
          currency: row.currency || 'USD',
          period_start: row.period_start,
          period_end: row.period_end,
          region: row.region || null,
          lob: row.lob || null,
          cost_center_code: row.cost_center_code || null,
          source: row.source || null,
          is_actual: row.is_actual !== 'false',
        };

        if (!data.metric_type || isNaN(data.value) || !data.period_start || !data.period_end) {
          errors.push({
            row: rowNum,
            message: 'Missing required fields: metric_type, value, period_start, period_end',
          });
          skippedCount++;
          continue;
        }

        const costCenterId = data.cost_center_code
          ? costCenterMap.get(data.cost_center_code)
          : null;

        if (data.cost_center_code && !costCenterId) {
          warnings.push(`Row ${rowNum}: Cost center "${data.cost_center_code}" not found`);
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        metricsToCreate.push({
          tenantId,
          metricType: data.metric_type,
          value: new Prisma.Decimal(data.value),
          currency: data.currency,
          periodStart: new Date(data.period_start),
          periodEnd: new Date(data.period_end),
          region: data.region,
          lob: data.lob,
          costCenterId,
          source: data.source,
          isActual: data.is_actual ?? true,
        });

        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    // Bulk insert
    if (!options.validateOnly && metricsToCreate.length > 0) {
      await this.prisma.financialMetric.createMany({
        data: metricsToCreate,
        skipDuplicates: options.mode === ImportMode.UPSERT,
      });
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // COSTS
  // ============================================

  async importCosts(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // Cache lookups
    const costCenters = await this.prisma.costCenter.findMany({
      where: { tenantId },
      select: { id: true, code: true },
    });
    const costCenterMap = new Map(costCenters.map((cc) => [cc.code, cc.id]));

    const vendors = await this.prisma.vendor.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id]));

    const costsToCreate: Prisma.CostCreateManyInput[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: CostImportDto = {
          category: row.category,
          subcategory: row.subcategory || null,
          vendor_name: row.vendor_name || null,
          amount: parseFloat(row.amount),
          currency: row.currency || 'USD',
          period_date: row.period_date,
          cost_center_code: row.cost_center_code || null,
          description: row.description || null,
          is_recurring: row.is_recurring === 'true',
        };

        if (!data.category || isNaN(data.amount) || !data.period_date) {
          errors.push({
            row: rowNum,
            message: 'Missing required fields: category, amount, period_date',
          });
          skippedCount++;
          continue;
        }

        const costCenterId = data.cost_center_code
          ? costCenterMap.get(data.cost_center_code)
          : null;
        const vendorId = data.vendor_name
          ? vendorMap.get(data.vendor_name.toLowerCase())
          : null;

        if (data.cost_center_code && !costCenterId) {
          warnings.push(`Row ${rowNum}: Cost center "${data.cost_center_code}" not found`);
        }
        if (data.vendor_name && !vendorId) {
          warnings.push(`Row ${rowNum}: Vendor "${data.vendor_name}" not found`);
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        costsToCreate.push({
          tenantId,
          category: data.category,
          subcategory: data.subcategory,
          vendorId,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          periodDate: new Date(data.period_date),
          costCenterId,
          description: data.description,
          isRecurring: data.is_recurring ?? false,
        });

        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    // Bulk insert
    if (!options.validateOnly && costsToCreate.length > 0) {
      await this.prisma.cost.createMany({
        data: costsToCreate,
      });
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // DEALS
  // ============================================

  async importDeals(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: DealImportDto = {
          external_id: row.external_id || null,
          name: row.name,
          account_name: row.account_name,
          amount: parseFloat(row.amount),
          currency: row.currency || 'USD',
          stage: row.stage,
          probability: parseFloat(row.probability),
          close_date: row.close_date || null,
          owner_name: row.owner_name || null,
          region: row.region || null,
          lob: row.lob || null,
          product_line: row.product_line || null,
          risk_level: row.risk_level || null,
          last_activity_at: row.last_activity_at || null,
        };

        if (!data.name || !data.account_name || isNaN(data.amount) || !data.stage) {
          errors.push({
            row: rowNum,
            message: 'Missing required fields: name, account_name, amount, stage',
          });
          skippedCount++;
          continue;
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        await this.prisma.deal.create({
          data: {
            tenantId,
            externalId: data.external_id,
            name: data.name,
            accountName: data.account_name,
            amount: new Prisma.Decimal(data.amount),
            currency: data.currency,
            stage: data.stage,
            probability: new Prisma.Decimal(data.probability),
            closeDate: data.close_date ? new Date(data.close_date) : null,
            ownerName: data.owner_name,
            region: data.region,
            lob: data.lob,
            productLine: data.product_line,
            riskLevel: data.risk_level,
            lastActivityAt: data.last_activity_at ? new Date(data.last_activity_at) : null,
          },
        });

        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // DEAL STAGE HISTORY
  // ============================================

  async importDealStageHistory(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // Cache deals by external ID
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      select: { id: true, externalId: true, name: true },
    });
    const dealMap = new Map<string, string>();
    deals.forEach((d) => {
      if (d.externalId) dealMap.set(d.externalId, d.id);
      dealMap.set(d.name.toLowerCase(), d.id);
    });

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: DealStageHistoryImportDto = {
          deal_external_id: row.deal_external_id,
          stage: row.stage,
          entered_at: row.entered_at,
          exited_at: row.exited_at || null,
          duration_days: row.duration_days ? parseInt(row.duration_days) : null,
        };

        if (!data.deal_external_id || !data.stage || !data.entered_at) {
          errors.push({
            row: rowNum,
            message: 'Missing required fields: deal_external_id, stage, entered_at',
          });
          skippedCount++;
          continue;
        }

        const dealId =
          dealMap.get(data.deal_external_id) ||
          dealMap.get(data.deal_external_id.toLowerCase());

        if (!dealId) {
          errors.push({
            row: rowNum,
            message: `Deal not found: ${data.deal_external_id}`,
          });
          skippedCount++;
          continue;
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        await this.prisma.dealStageHistory.create({
          data: {
            dealId,
            stage: data.stage,
            enteredAt: new Date(data.entered_at),
            exitedAt: data.exited_at ? new Date(data.exited_at) : null,
            duration: data.duration_days,
          },
        });

        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // ANOMALIES
  // ============================================

  async importAnomalies(
    csvContent: string,
    tenantId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const data: AnomalyImportDto = {
          severity: row.severity,
          category: row.category,
          metric_name: row.metric_name,
          account_code: row.account_code || null,
          description: row.description,
          current_value: parseFloat(row.current_value),
          expected_value: parseFloat(row.expected_value),
          variance_percent: parseFloat(row.variance_percent),
          detected_at: row.detected_at,
          status: row.status || 'unresolved',
          notes: row.notes || null,
        };

        if (
          !data.severity ||
          !data.category ||
          !data.metric_name ||
          !data.description ||
          !data.detected_at
        ) {
          errors.push({
            row: rowNum,
            message:
              'Missing required fields: severity, category, metric_name, description, detected_at',
          });
          skippedCount++;
          continue;
        }

        if (options.validateOnly) {
          importedCount++;
          continue;
        }

        const varianceAmount = data.current_value - data.expected_value;

        await this.prisma.anomaly.create({
          data: {
            tenantId,
            severity: data.severity,
            category: data.category,
            metricName: data.metric_name,
            accountCode: data.account_code,
            description: data.description,
            currentValue: new Prisma.Decimal(data.current_value),
            expectedValue: new Prisma.Decimal(data.expected_value),
            varianceAmount: new Prisma.Decimal(varianceAmount),
            variancePercent: new Prisma.Decimal(data.variance_percent),
            detectedAt: new Date(data.detected_at),
            status: data.status,
            notes: data.notes,
          },
        });

        importedCount++;
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
        if (!options.skipErrors) throw error;
        skippedCount++;
      }
    }

    return {
      success: errors.length === 0,
      totalRecords: records.length,
      importedRecords: importedCount,
      skippedRecords: skippedCount,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }

  // ============================================
  // VALIDATION
  // ============================================

  async validateImport(
    csvContent: string,
    entityType: string,
    tenantId: string,
  ): Promise<ValidationResultDto> {
    const options: ImportOptionsDto = { validateOnly: true, skipErrors: true };

    let result: ImportResultDto;

    switch (entityType) {
      case 'cost-centers':
        result = await this.importCostCenters(csvContent, tenantId, options);
        break;
      case 'vendors':
        result = await this.importVendors(csvContent, tenantId, options);
        break;
      case 'financial-metrics':
        result = await this.importFinancialMetrics(csvContent, tenantId, options);
        break;
      case 'costs':
        result = await this.importCosts(csvContent, tenantId, options);
        break;
      case 'deals':
        result = await this.importDeals(csvContent, tenantId, options);
        break;
      case 'deal-stage-history':
        result = await this.importDealStageHistory(csvContent, tenantId, options);
        break;
      case 'anomalies':
        result = await this.importAnomalies(csvContent, tenantId, options);
        break;
      default:
        throw new BadRequestException(`Unknown entity type: ${entityType}`);
    }

    return {
      isValid: result.errors.length === 0,
      totalRecords: result.totalRecords,
      validRecords: result.importedRecords,
      invalidRecords: result.skippedRecords,
      errors: result.errors,
      warnings: result.warnings,
    };
  }
}
