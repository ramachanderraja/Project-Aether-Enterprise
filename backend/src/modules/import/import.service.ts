import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DataService } from '../data/data.service';
import {
  ImportOptionsDto,
  ImportResultDto,
  ImportErrorDto,
  ValidationResultDto,
} from './dto';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly dataService: DataService) {}

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
  // FILE-BASED IMPORT
  // ============================================

  /**
   * Import a CSV file by writing it to the data directory and reloading in-memory data.
   * Maps entity types to their expected CSV file names.
   */
  async importCSVFile(
    entityType: string,
    csvContent: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();

    // Validate the CSV
    const records = this.parseCSV(csvContent);
    const errors: ImportErrorDto[] = [];
    const warnings: string[] = [];

    if (records.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    // Map entity type to file name
    const fileNameMap: Record<string, string> = {
      'closed-acv': 'closed_acv.csv',
      'pipeline-snapshots': 'monthly_pipeline_snapshot.csv',
      'arr-snapshots': 'monthly_arr_snapshot.csv',
      'sales-team': 'sales_team_structure.csv',
      'customer-name-mappings': 'customer_name_mapping.csv',
      'sow-mappings': 'sow_mapping.csv',
      'arr-subcategory-breakdown': 'arr_subcategory_breakdown.csv',
      'product-category-mapping': 'product_category_mapping.csv',
    };

    const fileName = fileNameMap[entityType];
    if (!fileName) {
      throw new BadRequestException(`Unknown entity type: ${entityType}. Valid types: ${Object.keys(fileNameMap).join(', ')}`);
    }

    if (options.validateOnly) {
      return {
        success: true,
        totalRecords: records.length,
        importedRecords: records.length,
        skippedRecords: 0,
        errors: [],
        warnings,
        duration: Date.now() - startTime,
      };
    }

    // Write the CSV file to the data directory
    const dataDir = this.dataService.getDataDir();
    const filePath = path.join(dataDir, fileName);

    try {
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      this.logger.log(`Wrote ${records.length} records to ${filePath}`);
    } catch (err) {
      throw new BadRequestException(`Failed to write file: ${err.message}`);
    }

    // Reload all in-memory data
    await this.dataService.loadAllData();

    return {
      success: true,
      totalRecords: records.length,
      importedRecords: records.length,
      skippedRecords: 0,
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
  ): Promise<ValidationResultDto> {
    const result = await this.importCSVFile(entityType, csvContent, { validateOnly: true });

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
