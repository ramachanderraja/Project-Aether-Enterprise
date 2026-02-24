/**
 * CSV parsing utilities – ported from frontend/src/shared/store/realDataStore.ts
 * so the backend produces identical parsed output.
 */

export function parseCSVLine(line: string): string[] {
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

/**
 * Split CSV text into logical rows, handling quoted fields that contain
 * newlines (e.g. Excel exports with multi-line cell values).
 */
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
        // Replace embedded newlines with space so downstream parsing works
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

export function parseCSV(text: string): Record<string, string>[] {
  const lines = splitCSVRows(text);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines
    .slice(1)
    .map(line => {
      const values = parseCSVLine(line);
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h.trim()] = (values[i] || '').trim();
      });
      return record;
    })
    .filter(r => Object.values(r).some(v => v !== ''));
}

export function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$%\s]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert scientific notation strings (e.g. "3.08157E+11") to full numeric
 * strings (e.g. "308157000000"). This handles Excel-corrupted IDs.
 */
export function normalizeNumericId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Check if it looks like scientific notation (e.g. 3.08E+11, 3.08157E+11)
  if (/^[\d.]+E\+\d+$/i.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num.toFixed(0);
    }
  }
  return trimmed;
}

export function parseDate(dateStr: string): string {
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

export function normalizeLogoType(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'New' || trimmed === 'New Logo') return 'New Logo';
  if (trimmed === 'Cross Sell' || trimmed === 'Cross-Sell') return 'Cross-Sell';
  if (trimmed === 'Renewal/Extn' || trimmed === 'Renewal/Extension') return 'Extension';
  return trimmed;
}

export function normalizeRegion(raw: string): string {
  const map: Record<string, string> = {
    NA: 'North America',
    EU: 'Europe',
    ME: 'Middle East',
    APAC: 'APAC',
    LA: 'LATAM',
    LATAM: 'LATAM',
    Global: 'Global',
  };
  return map[raw.trim()] || raw.trim() || '';
}
