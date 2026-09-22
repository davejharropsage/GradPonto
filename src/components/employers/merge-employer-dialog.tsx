"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Merge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mergeEmployers } from "@/lib/actions/employers";

export function MergeEmployerDialog({
  employerId,
  employerName,
  otherEmployers,
}: {
  employerId: string;
  employerName: string;
  otherEmployers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("NONE");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const target = otherEmployers.find((e) => e.id === targetId);

  function handleMerge() {
    if (targetId === "NONE") return;
    startTransition(async () => {
      try {
        await mergeEmployers(employerId, targetId);
        toast.success(`Merged into ${target?.name}`);
        setOpen(false);
        router.push(`/employers/${targetId}`);
      } catch {
        toast.error("Failed to merge employers");
      }
    });
  }

  if (otherEmployers.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <Merge className="h-4 w-4" />
            Merge
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge {employerName} into another company</DialogTitle>
          <DialogDescription>
            All applications currently under {employerName} move to the company you pick, then {employerName} is
            removed. {employerName}&apos;s own website, industry, and notes are not carried over — but if it has a
            contact the other company doesn&apos;t, that contact is kept.
          </DialogDescription>
        </DialogHeader>

        <Select value={targetId} onValueChange={(v) => setTargetId(v ?? "NONE")}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string) =>
                value === "NONE" ? "Choose the company to keep..." : (otherEmployers.find((e) => e.id === value)?.name ?? value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {otherEmployers.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleMerge} disabled={pending || targetId === "NONE"}>
            {pending ? "Merging..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
