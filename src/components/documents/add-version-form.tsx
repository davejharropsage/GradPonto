"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createBaseDocument } from "@/lib/actions/documents";

/** The "add another named version" affordance — a toggle button that reveals a small create form. */
export function AddVersionForm({
  kind,
  kindLabel,
  startOpen = false,
}: {
  kind: "CV" | "COVER_LETTER";
  kindLabel: string;
  /** Open by default when there's no version of this kind yet, so the page never looks empty. */
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add another {kindLabel.toLowerCase()} version
      </Button>
    );
  }

  return (
    <form
      action={createBaseDocument.bind(null, kind)}
      className="grid gap-3 rounded-lg border border-dashed p-4"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`new-name-${kind}`}>Version name</Label>
        <Input id={`new-name-${kind}`} name="name" placeholder={`e.g. "Tech ${kindLabel}"`} />
      </div>
      <Textarea name="content" rows={10} placeholder={`Paste this ${kindLabel.toLowerCase()} version here...`} />
      <div className="flex gap-2">
        <Button type="submit">Save {kindLabel}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
