"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { deleteWithUndo, deletedMessage } from "@/lib/undo-delete";

export function DeleteButton({
  action,
  label,
  redirectTo,
}: {
  action: () => Promise<void>;
  label: string;
  redirectTo: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}?</DialogTitle>
          <DialogDescription>You&apos;ll have a few seconds to undo this before it&apos;s gone for good.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false);
              router.push(redirectTo);
              deleteWithUndo({
                action,
                message: deletedMessage(label),
                onSettled: () => router.refresh(),
              });
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
