const fs = require('fs');
const path = require('path');

const files = ['monthly_arr_snapshot.csv', 'closed_acv.csv'];
const dataDir = path.resolve(__dirname, 'backend/data');

files.forEach(file => {
  const text = fs.readFileSync(path.join(dataDir, file), 'utf-8');

  // Find multi-line quoted fields
  const matches = [];
  let inQuotes = false;
  let fieldStart = -1;
  let hasNewline = false;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      if (!inQuotes) {
        inQuotes = true;
        fieldStart = i;
        hasNewline = false;
      } else if (i + 1 < text.length && text[i + 1] === '"') {
        i++; // skip escaped quote
      } else {
        inQuotes = false;
        if (hasNewline) {
          matches.push(text.substring(fieldStart, i + 1));
        }
      }
    } else if (text[i] === '\n' && inQuotes) {
      hasNewline = true;
    }
  }

  console.log(`=== ${file} ===`);
  console.log(`Multi-line quoted fields: ${matches.length}`);
  const unique = [...new Set(matches)];
  unique.forEach(m => console.log(`  ${JSON.stringify(m)}`));
});
