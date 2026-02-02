/**
 * Historical Data Seed Script for Project Aether
 *
 * This script loads historical data from CSV files into the database.
 * Run with: npx ts-node prisma/seed-historical.ts
 *
 * Prerequisites:
 * 1. Database must be migrated (npx prisma migrate dev)
 * 2. CSV files must be in the data-templates directory
 * 3. A tenant must exist in the database
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const DATA_DIR = path.join(__dirname, '../../data-templates');

interface ImportStats {
  entity: string;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================
// CSV PARSER
// ============================================

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error(`CSV file ${filePath} must have header and at least one data row`);
  }

  const headers = parseCSVLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || '';
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
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
// TENANT SETUP
// ============================================

async function getOrCreateTenant(): Promise<string> {
  let tenant = await prisma.tenant.findFirst();

  if (!tenant) {
    console.log('Creating default tenant...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Default Organization',
        domain: 'default.local',
        plan: 'enterprise',
        isActive: true,
      },
    });
  }

  console.log(`Using tenant: ${tenant.name} (${tenant.id})`);
  return tenant.id;
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

async function importCostCenters(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Cost Centers',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '01_cost_centers.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping cost centers - file not found');
    return stats;
  }

  const records = parseCSV(filePath);
  stats.total = records.length;

  // First pass: create all cost centers
  const costCenterMap = new Map<string, string>();

  for (const row of records) {
    try {
      const costCenter = await prisma.costCenter.upsert({
        where: { tenantId_code: { tenantId, code: row.code } },
        create: {
          tenantId,
          code: row.code,
          name: row.name,
          isActive: row.is_active !== 'false',
        },
        update: {
          name: row.name,
          isActive: row.is_active !== 'false',
        },
      });
      costCenterMap.set(row.code, costCenter.id);
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`${row.code}: ${error.message}`);
      stats.skipped++;
    }
  }

  // Second pass: update parent references
  for (const row of records) {
    if (row.parent_code && costCenterMap.has(row.parent_code)) {
      await prisma.costCenter.update({
        where: { tenantId_code: { tenantId, code: row.code } },
        data: { parentId: costCenterMap.get(row.parent_code) },
      });
    }
  }

  return stats;
}

async function importVendors(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Vendors',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '02_vendors.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping vendors - file not found');
    return stats;
  }

  const records = parseCSV(filePath);
  stats.total = records.length;

  for (const row of records) {
    try {
      await prisma.vendor.create({
        data: {
          tenantId,
          name: row.name,
          category: row.category || null,
          contractStart: row.contract_start ? new Date(row.contract_start) : null,
          contractEnd: row.contract_end ? new Date(row.contract_end) : null,
          paymentTerms: row.payment_terms || null,
          riskScore: row.risk_score || null,
          isActive: row.is_active !== 'false',
        },
      });
      stats.imported++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        stats.skipped++;
      } else {
        stats.errors.push(`${row.name}: ${error.message}`);
        stats.skipped++;
      }
    }
  }

  return stats;
}

async function importFinancialMetrics(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Financial Metrics',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '03_financial_metrics.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping financial metrics - file not found');
    return stats;
  }

  // Cache cost centers
  const costCenters = await prisma.costCenter.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  const costCenterMap = new Map(costCenters.map((cc) => [cc.code, cc.id]));

  const records = parseCSV(filePath);
  stats.total = records.length;

  const metricsToCreate: Prisma.FinancialMetricCreateManyInput[] = [];

  for (const row of records) {
    try {
      const value = parseFloat(row.value);
      if (isNaN(value)) {
        stats.errors.push(`Invalid value: ${row.value}`);
        stats.skipped++;
        continue;
      }

      const costCenterId = row.cost_center_code
        ? costCenterMap.get(row.cost_center_code)
        : null;

      metricsToCreate.push({
        tenantId,
        metricType: row.metric_type,
        value: new Prisma.Decimal(value),
        currency: row.currency || 'USD',
        periodStart: new Date(row.period_start),
        periodEnd: new Date(row.period_end),
        region: row.region || null,
        lob: row.lob || null,
        costCenterId,
        source: row.source || null,
        isActual: row.is_actual !== 'false',
      });
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`Row error: ${error.message}`);
      stats.skipped++;
    }
  }

  if (metricsToCreate.length > 0) {
    await prisma.financialMetric.createMany({
      data: metricsToCreate,
      skipDuplicates: true,
    });
  }

  return stats;
}

async function importCosts(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Costs',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '04_costs.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping costs - file not found');
    return stats;
  }

  // Cache lookups
  const costCenters = await prisma.costCenter.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  const costCenterMap = new Map(costCenters.map((cc) => [cc.code, cc.id]));

  const vendors = await prisma.vendor.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id]));

  const records = parseCSV(filePath);
  stats.total = records.length;

  const costsToCreate: Prisma.CostCreateManyInput[] = [];

  for (const row of records) {
    try {
      const amount = parseFloat(row.amount);
      if (isNaN(amount)) {
        stats.errors.push(`Invalid amount: ${row.amount}`);
        stats.skipped++;
        continue;
      }

      const costCenterId = row.cost_center_code
        ? costCenterMap.get(row.cost_center_code)
        : null;
      const vendorId = row.vendor_name
        ? vendorMap.get(row.vendor_name.toLowerCase())
        : null;

      costsToCreate.push({
        tenantId,
        category: row.category,
        subcategory: row.subcategory || null,
        vendorId,
        amount: new Prisma.Decimal(amount),
        currency: row.currency || 'USD',
        periodDate: new Date(row.period_date),
        costCenterId,
        description: row.description || null,
        isRecurring: row.is_recurring === 'true',
      });
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`Row error: ${error.message}`);
      stats.skipped++;
    }
  }

  if (costsToCreate.length > 0) {
    await prisma.cost.createMany({
      data: costsToCreate,
    });
  }

  return stats;
}

async function importDeals(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Deals',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '05_deals.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping deals - file not found');
    return stats;
  }

  const records = parseCSV(filePath);
  stats.total = records.length;

  for (const row of records) {
    try {
      const amount = parseFloat(row.amount);
      const probability = parseFloat(row.probability);

      if (isNaN(amount) || isNaN(probability)) {
        stats.errors.push(`Invalid amount or probability`);
        stats.skipped++;
        continue;
      }

      await prisma.deal.create({
        data: {
          tenantId,
          externalId: row.external_id || null,
          name: row.name,
          accountName: row.account_name,
          amount: new Prisma.Decimal(amount),
          currency: row.currency || 'USD',
          stage: row.stage,
          probability: new Prisma.Decimal(probability),
          closeDate: row.close_date ? new Date(row.close_date) : null,
          ownerName: row.owner_name || null,
          region: row.region || null,
          lob: row.lob || null,
          productLine: row.product_line || null,
          riskLevel: row.risk_level || null,
          lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : null,
        },
      });
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`${row.name}: ${error.message}`);
      stats.skipped++;
    }
  }

  return stats;
}

async function importDealStageHistory(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Deal Stage History',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '06_deal_stage_history.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping deal stage history - file not found');
    return stats;
  }

  // Cache deals
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    select: { id: true, externalId: true, name: true },
  });
  const dealMap = new Map<string, string>();
  deals.forEach((d) => {
    if (d.externalId) dealMap.set(d.externalId, d.id);
    dealMap.set(d.name.toLowerCase(), d.id);
  });

  const records = parseCSV(filePath);
  stats.total = records.length;

  for (const row of records) {
    try {
      const dealId =
        dealMap.get(row.deal_external_id) ||
        dealMap.get(row.deal_external_id.toLowerCase());

      if (!dealId) {
        stats.errors.push(`Deal not found: ${row.deal_external_id}`);
        stats.skipped++;
        continue;
      }

      await prisma.dealStageHistory.create({
        data: {
          dealId,
          stage: row.stage,
          enteredAt: new Date(row.entered_at),
          exitedAt: row.exited_at ? new Date(row.exited_at) : null,
          duration: row.duration_days ? parseInt(row.duration_days) : null,
        },
      });
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`Row error: ${error.message}`);
      stats.skipped++;
    }
  }

  return stats;
}

async function importAnomalies(tenantId: string): Promise<ImportStats> {
  const stats: ImportStats = {
    entity: 'Anomalies',
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const filePath = path.join(DATA_DIR, '08_anomalies.csv');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipping anomalies - file not found');
    return stats;
  }

  const records = parseCSV(filePath);
  stats.total = records.length;

  for (const row of records) {
    try {
      const currentValue = parseFloat(row.current_value);
      const expectedValue = parseFloat(row.expected_value);
      const variancePercent = parseFloat(row.variance_percent);

      if (isNaN(currentValue) || isNaN(expectedValue)) {
        stats.errors.push(`Invalid values in row`);
        stats.skipped++;
        continue;
      }

      const varianceAmount = currentValue - expectedValue;

      await prisma.anomaly.create({
        data: {
          tenantId,
          severity: row.severity,
          category: row.category,
          metricName: row.metric_name,
          accountCode: row.account_code || null,
          description: row.description,
          currentValue: new Prisma.Decimal(currentValue),
          expectedValue: new Prisma.Decimal(expectedValue),
          varianceAmount: new Prisma.Decimal(varianceAmount),
          variancePercent: new Prisma.Decimal(variancePercent),
          detectedAt: new Date(row.detected_at),
          status: row.status || 'unresolved',
          notes: row.notes || null,
        },
      });
      stats.imported++;
    } catch (error: any) {
      stats.errors.push(`Row error: ${error.message}`);
      stats.skipped++;
    }
  }

  return stats;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('Project Aether - Historical Data Import');
  console.log('='.repeat(60));
  console.log(`Data directory: ${DATA_DIR}`);
  console.log('');

  try {
    // Get or create tenant
    const tenantId = await getOrCreateTenant();
    console.log('');

    const allStats: ImportStats[] = [];

    // Import in order
    console.log('1. Importing Cost Centers...');
    allStats.push(await importCostCenters(tenantId));

    console.log('2. Importing Vendors...');
    allStats.push(await importVendors(tenantId));

    console.log('3. Importing Financial Metrics...');
    allStats.push(await importFinancialMetrics(tenantId));

    console.log('4. Importing Costs...');
    allStats.push(await importCosts(tenantId));

    console.log('5. Importing Deals...');
    allStats.push(await importDeals(tenantId));

    console.log('6. Importing Deal Stage History...');
    allStats.push(await importDealStageHistory(tenantId));

    console.log('7. Importing Anomalies...');
    allStats.push(await importAnomalies(tenantId));

    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log('Entity                  | Total | Imported | Skipped | Errors');
    console.log('-'.repeat(60));

    let totalRecords = 0;
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const stats of allStats) {
      console.log(
        `${stats.entity.padEnd(23)} | ${stats.total.toString().padStart(5)} | ${stats.imported
          .toString()
          .padStart(8)} | ${stats.skipped.toString().padStart(7)} | ${stats.errors.length
          .toString()
          .padStart(6)}`,
      );
      totalRecords += stats.total;
      totalImported += stats.imported;
      totalSkipped += stats.skipped;
      totalErrors += stats.errors.length;
    }

    console.log('-'.repeat(60));
    console.log(
      `${'TOTAL'.padEnd(23)} | ${totalRecords.toString().padStart(5)} | ${totalImported
        .toString()
        .padStart(8)} | ${totalSkipped.toString().padStart(7)} | ${totalErrors.toString().padStart(6)}`,
    );
    console.log('');

    // Print errors if any
    if (totalErrors > 0) {
      console.log('ERRORS:');
      for (const stats of allStats) {
        if (stats.errors.length > 0) {
          console.log(`\n  ${stats.entity}:`);
          stats.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
          if (stats.errors.length > 5) {
            console.log(`    ... and ${stats.errors.length - 5} more`);
          }
        }
      }
    }

    console.log('');
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
