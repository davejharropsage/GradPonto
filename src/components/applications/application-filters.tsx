"use client";

import { useRef } from "react";
import { Archive } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationStatusLabels } from "@/lib/labels";

export function ApplicationFilters({
  q,
  status,
  archived,
  archivedCount,
}: {
  q?: string;
  status?: string;
  archived: boolean;
  archivedCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateParamDebounced(key: string, value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(key, value), 300);
  }

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Search applications..."
        defaultValue={q}
        className="sm:max-w-xs"
        onChange={(e) => updateParamDebounced("q", e.target.value)}
      />
      <Select value={status || "ALL"} onValueChange={(v) => updateParam("status", v === "ALL" || !v ? "" : v)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="All statuses">
            {(value: string) => (value === "ALL" ? "All statuses" : applicationStatusLabels[value] ?? value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.entries(applicationStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {archivedCount > 0 && (
        <Button
          type="button"
          variant={archived ? "secondary" : "outline"}
          onClick={() => updateParam("archived", archived ? "" : "1")}
        >
          <Archive className="h-4 w-4" />
          {archived ? "Hide archived" : `Show archived (${archivedCount})`}
        </Button>
      )}
    </div>
  );
}
