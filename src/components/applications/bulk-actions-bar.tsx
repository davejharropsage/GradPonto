"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2, X } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { bulkArchiveApplications, bulkDeleteApplications, bulkUpdateApplicationStatus } from "@/lib/actions/applications";
import { applicationStatusLabels } from "@/lib/labels";
import { deleteWithUndo } from "@/lib/undo-delete";

export function BulkActionsBar({ selectedIds, onClear }: { selectedIds: string[]; onClear: () => void }) {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  if (selectedIds.length === 0) return null;

  function handleStatusChange(status: string | null) {
    if (!status) return;
    startTransition(async () => {
      try {
        await bulkUpdateApplicationStatus(selectedIds, status);
        toast.success(`Updated ${selectedIds.length} application${selectedIds.length === 1 ? "" : "s"}`);
        onClear();
        router.refresh();
      } catch {
        toast.error("Failed to update applications");
      }
    });
  }

  function handleArchive() {
    const ids = selectedIds;
    const count = ids.length;
    startTransition(async () => {
      try {
        await bulkArchiveApplications(ids);
        toast.success(`Archived ${count} application${count === 1 ? "" : "s"}`);
        onClear();
        router.refresh();
      } catch {
        toast.error("Failed to archive applications");
      }
    });
  }

  function handleDelete() {
    const ids = selectedIds;
    const count = ids.length;
    setDeleteOpen(false);
    onClear();
    deleteWithUndo({
      action: () => bulkDeleteApplications(ids),
      message: `${count} application${count === 1 ? "" : "s"} deleted`,
      onSettled: () => router.refresh(),
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border bg-muted px-4 py-2.5">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>

      <Select onValueChange={handleStatusChange} disabled={pending}>
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="Change status to..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(applicationStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleArchive}>
        <Archive className="h-3.5 w-3.5" />
        Archive
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" disabled={pending}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.length} application{selectedIds.length === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>You&apos;ll have a few seconds to undo this before it&apos;s gone for good.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
        Clear selection
      </Button>
    </div>
  );
}
