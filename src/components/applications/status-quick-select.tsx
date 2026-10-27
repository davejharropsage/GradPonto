"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { ColorDot } from "@/components/shared/status-badge";
import { applicationStatusDotColors, applicationStatusLabels } from "@/lib/labels";

export function StatusQuickSelect({ applicationId, status }: { applicationId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(next: string | null) {
    if (!next || next === status) return;
    startTransition(async () => {
      try {
        await updateApplicationStatus(applicationId, next);
        toast.success(`Status changed to ${applicationStatusLabels[next]}`);
        router.refresh();
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger
        size="sm"
        className="h-5 w-fit gap-1.5 rounded-4xl border-border px-2 py-0.5 text-xs font-medium shadow-none"
      >
        <ColorDot className={applicationStatusDotColors[status]} />
        <SelectValue>{(value: string) => applicationStatusLabels[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(applicationStatusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            <ColorDot className={applicationStatusDotColors[value]} />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
