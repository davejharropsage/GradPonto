"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { looksLikeDuplicate } from "@/lib/fuzzy";
import type { Employer } from "@/generated/prisma/client";

export function EmployerForm({
  action,
  employer,
  existingEmployers = [],
}: {
  action: (formData: FormData) => void;
  employer?: Employer | null;
  existingEmployers?: { id: string; name: string }[];
}) {
  const [name, setName] = useState(employer?.name ?? "");

  const possibleDuplicates = useMemo(() => {
    if (!name.trim()) return [];
    return existingEmployers.filter((e) => e.id !== employer?.id && looksLikeDuplicate(e.name, name));
  }, [name, existingEmployers, employer?.id]);

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Employer name *</Label>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {possibleDuplicates.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This looks similar to{" "}
            {possibleDuplicates.map((e, i) => (
              <span key={e.id}>
                {i > 0 && ", "}
                <Link href={`/employers/${e.id}`} className="underline hover:text-amber-950 dark:hover:text-amber-100">
                  {e.name}
                </Link>
              </span>
            ))}
            , already on file. If it&apos;s the same company, use that one instead to keep applications together.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={employer?.website ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" defaultValue={employer?.industry ?? ""} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={employer?.notes ?? ""} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit">{employer ? "Save Changes" : "Create Employer"}</Button>
      </div>
    </form>
  );
}
