/**
 * One-time backfill script: loads monthly_pipeline_snapshot.csv into the
 * pipeline_snapshots table with source='csv_import'.
 *
 * Usage: npx ts-node prisma/seed-pipeline-snapshots.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Inline CSV helpers (same as csv-parser.util.ts to avoid TS path issues)
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

async function main() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Connected to database');

    const csvPath = path.resolve(__dirname, '..', 'data', 'monthly_pipeline_snapshot.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV not found: ${csvPath}`);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows from CSV`);

    // Check existing count
    const existingCount = await prisma.pipelineSnapshot.count({
      where: { source: 'csv_import' },
    });
    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing csv_import rows. Deleting before re-import...`,
      );
      await prisma.pipelineSnapshot.deleteMany({
        where: { source: 'csv_import' },
      });
    }

    // Transform and batch insert
    const BATCH_SIZE = 500;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const records = batch.map((row) => {
        const snapshotDate = parseDate(row['Snapshot_Month'] || '');
        const expectedClose = parseDate(
          row['Expected_Close_Date'] || '',
        );
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
          `Failed batch at offset ${i}: ${(err as Error).message}`,
        );
        failed += batch.length;
      }

      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= rows.length) {
        console.log(
          `Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} processed (${inserted} inserted, ${failed} failed)`,
        );
      }
    }

    console.log(
      `\nBackfill complete: ${inserted} inserted, ${failed} failed out of ${rows.length} rows`,
    );

    // Verify
    const totalCount = await prisma.pipelineSnapshot.count();
    console.log(`Total pipeline_snapshots rows in DB: ${totalCount}`);
  } catch (err) {
    console.error(`Backfill failed: ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
