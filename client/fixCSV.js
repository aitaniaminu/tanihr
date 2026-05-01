/**
 * CSV Date & LGA Fixer for TaniHR
 *
 * Usage:
 *   node fixCSV.js <input.csv> [output.csv]
 *
 * - Strips leading ' characters
 * - Converts all date columns to DD-MM-YYYY format
 * - Supports: DD-Mon-YY (27-Oct-69), YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
 * - Normalizes LGA names to uppercase
 */

import fs from 'fs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node fixCSV.js <input.csv> [output.csv]');
  process.exit(1);
}

const outputFile = process.argv[3] || inputFile.replace('.csv', '_fixed.csv');

const csvContent = fs.readFileSync(inputFile, 'utf8');
const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());

if (lines.length < 2) {
  console.error('CSV file appears empty or no data rows.');
  process.exit(1);
}

const headers = parseCSVLine(lines[0]);
console.log('Detected columns:', headers.length);

// Auto-detect date columns
const dateColIndices = [];
let lgaColIndex = -1;

headers.forEach((h, idx) => {
  const name = h.trim().toLowerCase();
  if (name === 'dob' || name === 'date of birth' || name.includes('date')) {
    dateColIndices.push(idx);
    console.log(`  Date column: "${h}" (index ${idx})`);
  }
  if (name === 'lga') lgaColIndex = idx;
});

const MONTH_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  sept: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function fixDate(dateStr) {
  if (!dateStr) return '';

  let str = dateStr.trim();
  // Strip leading '
  if (str.startsWith("'")) str = str.slice(1);
  str = str.trim();
  if (!str) return '';

  // DD-Mon-YY  (e.g., 27-Oct-69, 01-Mar-07)
  const monthMatch = str.match(/^(\d{1,2})[-\/](\w{3,9})[-\/](\d{1,4})$/);
  if (monthMatch) {
    const day = parseInt(monthMatch[1]);
    const monStr = monthMatch[2].toLowerCase();
    let year = parseInt(monthMatch[3]);
    const month = MONTH_MAP[monStr];

    if (!month) return '';
    if (year < 100) year += year > 50 ? 1900 : 2000;

    return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[-\/.]/);
  if (parts.length === 3) {
    let day, month, year;

    if (parts[0].length === 4) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else if (parts[2].length === 4) {
      year = parseInt(parts[2]);
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
    } else {
      year = parseInt(parts[2]);
      if (year < 100) year += year > 50 ? 1900 : 2000;
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    if (day > 12 && day <= 31 && month <= 12) [day, month] = [month, day];
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return '';

    return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
  }

  return '';
}

function normalizeLGA(lgaStr) {
  if (!lgaStr || !lgaStr.trim()) return lgaStr;
  let s = lgaStr.trim();
  if (s.startsWith("'")) s = s.slice(1);
  return s.trim().toUpperCase();
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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

// Clean headers (strip leading ')
const cleanHeaders = headers.map((h) => h.replace(/^'/g, ''));

let dateFixedCount = 0;
let dateFailedCount = 0;

const outputLines = [cleanHeaders.join(',')];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const fields = parseCSVLine(line);
  while (fields.length < headers.length) fields.push('');

  for (const idx of dateColIndices) {
    if (fields[idx]) {
      const original = fields[idx].trim();
      const fixed = fixDate(original);
      if (fixed && fixed !== original) {
        fields[idx] = fixed;
        dateFixedCount++;
      } else if (!fixed && original) {
        dateFailedCount++;
        console.warn(`  Row ${i + 1}: Could not parse date "${original}"`);
      }
    }
  }

  if (lgaColIndex >= 0 && fields[lgaColIndex]) {
    fields[lgaColIndex] = normalizeLGA(fields[lgaColIndex]);
  }

  outputLines.push(fields.join(','));
}

fs.writeFileSync(outputFile, outputLines.join('\n') + '\n');

console.log('\n=== Summary ===');
console.log(`Dates converted: ${dateFixedCount}`);
console.log(`Dates failed: ${dateFailedCount}`);
console.log(`Output: ${outputFile}`);
