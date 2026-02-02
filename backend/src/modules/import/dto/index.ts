import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum ImportMode {
  INSERT = 'insert',
  UPSERT = 'upsert',
  REPLACE = 'replace',
}

export class ImportOptionsDto {
  @IsEnum(ImportMode)
  @IsOptional()
  mode?: ImportMode = ImportMode.INSERT;

  @IsBoolean()
  @IsOptional()
  validateOnly?: boolean = false;

  @IsBoolean()
  @IsOptional()
  skipErrors?: boolean = false;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class ImportResultDto {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: ImportErrorDto[];
  warnings: string[];
  duration: number;
}

export class ImportErrorDto {
  row: number;
  field?: string;
  value?: string;
  message: string;
}

export class ValidationResultDto {
  isValid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ImportErrorDto[];
  warnings: string[];
}

export class CostCenterImportDto {
  code: string;
  name: string;
  parent_code?: string;
  is_active?: boolean;
}

export class VendorImportDto {
  name: string;
  category?: string;
  contract_start?: string;
  contract_end?: string;
  payment_terms?: string;
  risk_score?: string;
  is_active?: boolean;
}

export class FinancialMetricImportDto {
  metric_type: string;
  value: number;
  currency?: string;
  period_start: string;
  period_end: string;
  region?: string;
  lob?: string;
  cost_center_code?: string;
  source?: string;
  is_actual?: boolean;
}

export class CostImportDto {
  category: string;
  subcategory?: string;
  vendor_name?: string;
  amount: number;
  currency?: string;
  period_date: string;
  cost_center_code?: string;
  description?: string;
  is_recurring?: boolean;
}

export class DealImportDto {
  external_id?: string;
  name: string;
  account_name: string;
  amount: number;
  currency?: string;
  stage: string;
  probability: number;
  close_date?: string;
  owner_name?: string;
  region?: string;
  lob?: string;
  product_line?: string;
  risk_level?: string;
  last_activity_at?: string;
}

export class DealStageHistoryImportDto {
  deal_external_id: string;
  stage: string;
  entered_at: string;
  exited_at?: string;
  duration_days?: number;
}

export class AnomalyImportDto {
  severity: string;
  category: string;
  metric_name: string;
  account_code?: string;
  description: string;
  current_value: number;
  expected_value: number;
  variance_percent: number;
  detected_at: string;
  status?: string;
  notes?: string;
}
