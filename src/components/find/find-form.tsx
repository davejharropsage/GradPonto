"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Keywords + location. Searching updates the address (?q=...&where=...) so results survive refresh and Back. */
export function FindForm({ initialQuery, initialWhere }: { initialQuery: string; initialWhere: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [where, setWhere] = useState(initialWhere);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (where.trim()) params.set("where", where.trim());
    startTransition(() => router.push(`/find${params.size ? `?${params.toString()}` : ""}`));
  }

  return (
    <form onSubmit={submit} role="search" className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
      <div className="grid gap-1.5">
        <label htmlFor="find-keywords" className="text-sm font-semibold">
          Keywords
        </label>
        <Input
          id="find-keywords"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. data analytics, business studies"
          maxLength={200}
          autoComplete="off"
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="find-where" className="text-sm font-semibold">
          Location <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="find-where"
          name="where"
          value={where}
          onChange={(event) => setWhere(event.target.value)}
          placeholder="e.g. London"
          maxLength={60}
          autoComplete="off"
          className="h-10"
        />
      </div>
      <Button type="submit" size="lg" disabled={pending || query.trim().length === 0} className="h-10">
        <Search className="h-4 w-4" />
        {pending ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
