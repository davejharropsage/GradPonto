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
