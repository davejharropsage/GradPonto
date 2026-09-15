import { applicationStatusLabels, priorityLabels } from "@/lib/labels";

export interface ImportTargetField {
  key: string;
  label: string;
  required?: boolean;
}

// The importable fields, in the same order (and using the same header names)
// as the CSV export — so a file downloaded from Export CSV maps itself
// automatically when re-imported.
export const importTargetFields: ImportTargetField[] = [
  { key: "title", label: "Job title", required: true },
  { key: "company", label: "Company", required: true },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "archived", label: "Archived" },
  { key: "priority", label: "Priority" },
  { key: "salary", label: "Salary" },
  { key: "source", label: "Source" },
  { key: "jobUrl", label: "Job URL" },
  { key: "deadline", label: "Deadline" },
  { key: "appliedAt", label: "Applied At" },
  { key: "createdAt", label: "Created At" },
  { key: "notes", label: "Notes" },
];

// Header names (from our own CSV export) that should auto-map to each
// target field, so re-importing an export needs no manual mapping.
const headerAliases: Record<string, string> = {
  title: "title",
  "job title": "title",
  company: "company",
  location: "location",
  status: "status",
  archived: "archived",
  priority: "priority",
  salary: "salary",
  source: "source",
  "job url": "jobUrl",
  "joburl": "jobUrl",
  deadline: "deadline",
  "applied at": "appliedAt",
  "appliedat": "appliedAt",
  "created at": "createdAt",
  "createdat": "createdAt",
  notes: "notes",
};

export function guessColumnMapping(headers: string[]): Record<number, string | null> {
  const mapping: Record<number, string | null> = {};
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    mapping[index] = headerAliases[normalized] ?? null;
  });
  return mapping;
}

const statusByLabel: Record<string, string> = Object.fromEntries(
  Object.entries(applicationStatusLabels).map(([key, label]) => [label.toLowerCase(), key])
);

const priorityByLabel: Record<string, string> = Object.fromEntries(
  Object.entries(priorityLabels).map(([key, label]) => [label.toLowerCase().replace(/\s*priority$/, ""), key])
);

export function resolveStatus(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  if (applicationStatusLabels[raw.trim().toUpperCase()]) return raw.trim().toUpperCase();
  return statusByLabel[normalized] ?? null;
}

export function resolvePriority(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  if (priorityLabels[raw.trim().toUpperCase()]) return raw.trim().toUpperCase();
  return priorityByLabel[normalized] ?? null;
}

export function resolveBoolean(raw: string): boolean {
  return ["yes", "true", "1", "y"].includes(raw.trim().toLowerCase());
}

// Accepts ISO (yyyy-mm-dd) and a few common spreadsheet date formats
// (dd/mm/yyyy, mm/dd/yyyy is ambiguous so we prefer day-first — UK convention
// matching the rest of the app's date formatting).
export function parseImportDate(raw: string): { date: Date | null; valid: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { date: null, valid: true };

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(trimmed);
    return { date: isNaN(date.getTime()) ? null : date, valid: !isNaN(date.getTime()) };
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const valid = date.getMonth() === Number(m) - 1 && date.getDate() === Number(d);
    return { date: valid ? date : null, valid };
  }

  return { date: null, valid: false };
}
