// Minimal CSV serialization: quotes a field only when it contains a comma,
// quote, or newline, doubling any internal quotes per RFC 4180.
function toCsvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(toCsvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(toCsvField).join(","));
  }
  // Leading BOM so Excel opens UTF-8 CSVs without mangling non-ASCII characters.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// RFC 4180 parser: handles quoted fields (with embedded commas/newlines) and
// doubled-quote escaping. Strips a leading BOM if present. Every row is
// padded/trimmed to the header's column count isn't done here — callers
// should handle ragged rows themselves.
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  function pushField() {
    row.push(field);
    field = "";
  }
  function pushRow() {
    pushField();
    // Skip fully-blank trailing rows (e.g. a trailing newline at EOF).
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  }

  while (i < clean.length) {
    const char = clean[i];

    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      pushField();
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field !== "" || row.length > 0) pushRow();

  const [headers, ...dataRows] = rows;
  return { headers: headers ?? [], rows: dataRows };
}
