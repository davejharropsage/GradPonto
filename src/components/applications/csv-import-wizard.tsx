"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { parseCsv } from "@/lib/csv";
import {
  importTargetFields,
  guessColumnMapping,
  resolveStatus,
  resolvePriority,
  resolveBoolean,
  parseImportDate,
} from "@/lib/import/applications-csv";
import { bulkImportApplications, type ImportRow } from "@/lib/actions/import";

type Step = "upload" | "map" | "preview";

interface ExistingSummary {
  title: string;
  employerName: string;
}

interface ParsedRow {
  index: number;
  row: ImportRow;
  errors: string[];
  isDuplicate: boolean;
}

export function CsvImportWizard({ existingApplications }: { existingApplications: ExistingSummary[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [raw, setRaw] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string | null>>({});
  const [includeDuplicates, setIncludeDuplicates] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const existingKeys = useMemo(
    () => new Set(existingApplications.map((a) => `${a.employerName.trim().toLowerCase()}::${a.title.trim().toLowerCase()}`)),
    [existingApplications]
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function handleParse() {
    if (!raw.trim()) {
      toast.error("Paste some CSV content or choose a file first");
      return;
    }
    const { headers: parsedHeaders, rows } = parseCsv(raw);
    if (parsedHeaders.length === 0 || rows.length === 0) {
      toast.error("Couldn't find any rows in that CSV");
      return;
    }
    setHeaders(parsedHeaders);
    setDataRows(rows);
    setMapping(guessColumnMapping(parsedHeaders));
    setStep("map");
  }

  const parsedRows: ParsedRow[] = useMemo(() => {
    if (step !== "preview") return [];

    const fieldToColumn = new Map<string, number>();
    Object.entries(mapping).forEach(([colIndex, field]) => {
      if (field) fieldToColumn.set(field, Number(colIndex));
    });

    function cell(row: string[], field: string): string {
      const col = fieldToColumn.get(field);
      return col === undefined ? "" : (row[col] ?? "");
    }

    return dataRows.map((row, index) => {
      const errors: string[] = [];

      const title = cell(row, "title").trim();
      const company = cell(row, "company").trim();
      if (!title) errors.push("Missing job title");
      if (!company) errors.push("Missing company");

      const statusRaw = cell(row, "status").trim();
      const status = statusRaw ? resolveStatus(statusRaw) : "INTERESTED";
      if (statusRaw && !status) errors.push(`Unrecognized status "${statusRaw}", will default to Interested`);

      const priorityRaw = cell(row, "priority").trim();
      const priority = priorityRaw ? resolvePriority(priorityRaw) : "MEDIUM";
      if (priorityRaw && !priority) errors.push(`Unrecognized priority "${priorityRaw}", will default to Medium`);

      const deadlineRaw = cell(row, "deadline").trim();
      const deadline = parseImportDate(deadlineRaw);
      if (deadlineRaw && !deadline.valid) errors.push(`Unrecognized deadline date "${deadlineRaw}"`);

      const appliedAtRaw = cell(row, "appliedAt").trim();
      const appliedAt = parseImportDate(appliedAtRaw);
      if (appliedAtRaw && !appliedAt.valid) errors.push(`Unrecognized applied-at date "${appliedAtRaw}"`);

      const createdAtRaw = cell(row, "createdAt").trim();
      const createdAt = parseImportDate(createdAtRaw);
      if (createdAtRaw && !createdAt.valid) errors.push(`Unrecognized created-at date "${createdAtRaw}"`);

      const isDuplicate =
        Boolean(title) && Boolean(company) && existingKeys.has(`${company.toLowerCase()}::${title.toLowerCase()}`);

      const importRow: ImportRow = {
        title,
        company,
        location: cell(row, "location").trim() || undefined,
        status: status ?? "INTERESTED",
        priority: priority ?? "MEDIUM",
        archived: resolveBoolean(cell(row, "archived")),
        salary: cell(row, "salary").trim() || undefined,
        source: cell(row, "source").trim() || undefined,
        jobUrl: cell(row, "jobUrl").trim() || undefined,
        deadline: deadline.date ? deadline.date.toISOString() : undefined,
        appliedAt: appliedAt.date ? appliedAt.date.toISOString() : undefined,
        createdAt: createdAt.date ? createdAt.date.toISOString() : undefined,
        notes: cell(row, "notes").trim() || undefined,
      };

      return { index, row: importRow, errors, isDuplicate };
    });
  }, [step, dataRows, mapping, existingKeys]);

  const importableRows = parsedRows.filter((r) => {
    const hardError = !r.row.title || !r.row.company;
    if (hardError) return false;
    if (r.isDuplicate && !includeDuplicates.has(r.index)) return false;
    return true;
  });

  const skippedForErrors = parsedRows.filter((r) => !r.row.title || !r.row.company).length;
  const skippedForDuplicate = parsedRows.filter((r) => r.isDuplicate && !includeDuplicates.has(r.index)).length;

  function handleImport() {
    startTransition(async () => {
      try {
        const { created } = await bulkImportApplications(importableRows.map((r) => r.row));
        toast.success(`Imported ${created} application${created === 1 ? "" : "s"}`);
        router.push("/applications");
      } catch {
        toast.error("Import failed. Check your file and try again.");
      }
    });
  }

  if (step === "upload") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-primary/50"
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Choose a CSV file</span>
            <span className="text-xs text-muted-foreground">Or paste CSV content below</span>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
          <Textarea
            rows={8}
            placeholder="title,company,location,status,..."
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="font-mono text-xs"
          />
          <Button type="button" onClick={handleParse}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "map") {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Match each column in your file to a field. Columns set to &quot;Don&apos;t import&quot; are ignored.
          </p>
          <div className="grid gap-3">
            {headers.map((header, index) => (
              <div key={index} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <div className="truncate rounded-md border bg-muted px-3 py-2 text-sm font-medium">{header}</div>
                <span className="hidden text-muted-foreground sm:block">→</span>
                <Select
                  value={mapping[index] ?? "NONE"}
                  onValueChange={(v) => setMapping((prev) => ({ ...prev, [index]: v === "NONE" ? null : v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value === "NONE" ? "Don't import" : importTargetFields.find((f) => f.key === value)?.label ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Don&apos;t import</SelectItem>
                    {importTargetFields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                const mapped = Object.values(mapping);
                if (!mapped.includes("title") || !mapped.includes("company")) {
                  toast.error("Map a column to both Job title and Company before continuing");
                  return;
                }
                setStep("preview");
              }}
            >
              Preview import
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {importableRows.length} will be imported
          </span>
          {skippedForErrors > 0 && (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {skippedForErrors} skipped (missing title or company)
            </span>
          )}
          {skippedForDuplicate > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Circle className="h-4 w-4" />
              {skippedForDuplicate} possible duplicate{skippedForDuplicate === 1 ? "" : "s"} skipped
            </span>
          )}
        </div>

        <div className="max-h-[28rem] overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2">Deadline</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {parsedRows.map((r) => {
                const hardError = !r.row.title || !r.row.company;
                return (
                  <tr key={r.index} className={hardError ? "bg-destructive/5" : r.isDuplicate ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                    <td className="p-2">{r.row.title || <span className="text-destructive">Missing</span>}</td>
                    <td className="p-2">{r.row.company || <span className="text-destructive">Missing</span>}</td>
                    <td className="p-2">{r.row.status}</td>
                    <td className="p-2">{r.row.deadline ? new Date(r.row.deadline).toLocaleDateString("en-GB") : ""}</td>
                    <td className="p-2">
                      {hardError ? (
                        <span className="text-xs text-destructive">{r.errors.join("; ")}</span>
                      ) : r.isDuplicate ? (
                        <label className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                          <Checkbox
                            checked={includeDuplicates.has(r.index)}
                            onCheckedChange={(checked) =>
                              setIncludeDuplicates((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(r.index);
                                else next.delete(r.index);
                                return next;
                              })
                            }
                          />
                          Possible duplicate: import anyway
                        </label>
                      ) : r.errors.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{r.errors.join("; ")}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setStep("map")} disabled={pending}>
            Back
          </Button>
          <Button type="button" onClick={handleImport} disabled={pending || importableRows.length === 0}>
            {pending ? "Importing..." : `Import ${importableRows.length} application${importableRows.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
