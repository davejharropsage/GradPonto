"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { restoreBackupData } from "@/lib/actions/backup";

export function RestoreBackupForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (!pendingFile) return;
    const file = pendingFile;
    startTransition(async () => {
      try {
        const text = await file.text();
        const result = await restoreBackupData(text);
        toast.success(
          `Restored ${result.applications} application${result.applications === 1 ? "" : "s"}, ${result.employers} employer${result.employers === 1 ? "" : "s"}, and ${result.activities} activity entries.`
        );
        setConfirmOpen(false);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Restore failed. Check the file and try again.");
      }
    });
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChosen} className="hidden" id="restore-file" />
      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        Restore from backup
      </Button>

      <Dialog open={confirmOpen} onOpenChange={(open) => !pending && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from {pendingFile?.name}?</DialogTitle>
            <DialogDescription>
              This adds the backup&apos;s applications, employers, documents, and activity to what you already have.
              Nothing existing is deleted or overwritten, but restoring the same backup twice will create duplicates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? "Restoring..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
