"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { setSkills } from "@/lib/actions/cv-builder";
import type { Skill } from "@/generated/prisma/client";

/** Skills are authored as one comma-separated line — the natural way most CVs list them — and
 * saved as a whole, rather than needing separate add/remove controls per skill. */
export function SkillsSection({ documentId, skills }: { documentId: string; skills: Skill[] }) {
  const [value, setValue] = useState(skills.map((s) => s.name).join(", "));
  const [saving, startSaving] = useTransition();

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      try {
        await setSkills(documentId, formData);
        toast.success("Saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Separate with commas</Label>
            <Input name="skills" value={value} onChange={(e) => setValue(e.target.value)} placeholder="SQL, Python, Power BI, Excel" />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
