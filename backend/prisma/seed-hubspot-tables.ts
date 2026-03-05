/**
 * Standalone seed script for the 3 HubSpot tables ONLY:
 *   1. pipeline_snapshots  — backfill from monthly_pipeline_snapshot.csv
 *   2. hubspot_sync_logs   — cleared (populated by sync jobs)
 *   3. hubspot_stage_mappings — cleared (populated by sync jobs)
 *
 * Usage: npx ts-node prisma/seed-hubspot-tables.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ── CSV helpers (inlined to avoid TS path alias issues) ──

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '""';
          i++;
        } else {
          inQuotes = false;
          current += char;
        }
      } else {
        current += char === '\n' || char === '\r' ? ' ' : char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        current += char;
      } else if (char === '\n') {
        if (current.trim()) rows.push(current.replace(/\r$/, ''));
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) rows.push(current.replace(/\r$/, ''));
  return rows;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = splitCSVRows(text);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line);
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h.trim()] = (values[i] || '').trim();
      });
      return record;
    })
    .filter((r) => Object.values(r).some((v) => v !== ''));
}

function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$%\s]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

function normalizeNumericId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^[\d.]+E\+\d+$/i.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) return num.toFixed(0);
  }
  return trimmed;
}

function normalizeLogoType(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'New' || trimmed === 'New Logo') return 'New Logo';
  if (trimmed === 'Cross Sell' || trimmed === 'Cross-Sell') return 'Cross-Sell';
  if (trimmed === 'Renewal/Extn' || trimmed === 'Renewal/Extension')
    return 'Extension';
  return trimmed;
}

// ── Main ──

async function main() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // ─── Table 1: hubspot_stage_mappings — clear ───
    const deletedMappings = await prisma.hubspotStageMapping.deleteMany();
    console.log(
      `[hubspot_stage_mappings] Cleared ${deletedMappings.count} rows (will be populated by sync jobs)`,
    );

    // ─── Table 2: hubspot_sync_logs — clear ───
    const deletedLogs = await prisma.hubspotSyncLog.deleteMany();
    console.log(
      `[hubspot_sync_logs] Cleared ${deletedLogs.count} rows (will be populated by sync jobs)`,
    );

    // ─── Table 3: pipeline_snapshots — clear + backfill from CSV ───
    const deletedSnapshots = await prisma.pipelineSnapshot.deleteMany();
    console.log(
      `[pipeline_snapshots] Cleared ${deletedSnapshots.count} existing rows`,
    );

    const csvPath = path.resolve(
      __dirname,
      '..',
      'data',
      'monthly_pipeline_snapshot.csv',
    );
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV not found: ${csvPath}`);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvText);
    console.log(`[pipeline_snapshots] Parsed ${rows.length} rows from CSV`);

    const BATCH_SIZE = 500;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const records = batch.map((row) => {
        const snapshotDate = parseDate(row['Snapshot_Month'] || '');
        const expectedClose = parseDate(row['Expected_Close_Date'] || '');
        const createdDate = parseDate(
          row['Created Date'] || row['Created_Date'] || '',
        );

        return {
          tenantId: 'default',
          snapshotMonth: snapshotDate ? new Date(snapshotDate) : new Date(),
          hubspotDealId: normalizeNumericId(row['Pipeline_Deal_ID'] || ''),
          dealName: row['Deal_Name'] || '',
          customerName: row['Customer_Name'] || '',
          dealValue: parseNumber(row['Deal_Value'] || ''),
          licenseAcv: parseNumber(row['License_ACV'] || ''),
          implementationValue: parseNumber(
            row['Implementation_Value'] || '',
          ),
          logoType: normalizeLogoType(row['Logo_Type'] || '') || null,
          dealStage: (row['Deal_Stage'] || '').trim(),
          currentStage: (row['Current_Stage'] || '').trim(),
          probability: parseNumber(row['Probability'] || ''),
          expectedCloseDate: expectedClose ? new Date(expectedClose) : null,
          region: (row['Region'] || '').trim() || null,
          vertical: (row['Vertical'] || '').trim() || null,
          segment: (row['Segment'] || '').trim() || null,
          productSubCategory:
            (row['Product_Sub_Category'] || '').trim() || null,
          salesRep: (row['Sales_Rep'] || '').trim() || null,
          ownerSalesTeam: null,
          createdDate: createdDate ? new Date(createdDate) : null,
          source: 'csv_import',
        };
      });

      try {
        const result = await prisma.pipelineSnapshot.createMany({
          data: records,
          skipDuplicates: true,
        });
        inserted += result.count;
      } catch (err) {
        console.error(
          `  Failed batch at offset ${i}: ${(err as Error).message}`,
        );
        failed += batch.length;
      }

      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= rows.length) {
        console.log(
          `  Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} (${inserted} inserted, ${failed} failed)`,
        );
      }
    }

    // ─── Summary ───
    const totalSnapshots = await prisma.pipelineSnapshot.count();
    const totalMappings = await prisma.hubspotStageMapping.count();
    const totalLogs = await prisma.hubspotSyncLog.count();

    console.log('\n=== Seed Complete ===');
    console.log(`  pipeline_snapshots:      ${totalSnapshots} rows (${inserted} from CSV)`);
    console.log(`  hubspot_stage_mappings:  ${totalMappings} rows (ready for sync)`);
    console.log(`  hubspot_sync_logs:       ${totalLogs} rows (ready for sync)`);
  } catch (err) {
    console.error(`Seed failed: ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
