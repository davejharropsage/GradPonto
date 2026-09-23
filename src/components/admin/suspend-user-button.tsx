"use client";

import { useState, useTransition } from "react";
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
import { suspendUser, reinstateUser } from "@/lib/actions/admin";

export function SuspendUserButton({
  userId,
  email,
  suspended,
  isSelf,
}: {
  userId: string;
  email: string;
  suspended: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (suspended) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await reinstateUser(userId);
              toast.success(`Reinstated ${email}`);
            } catch {
              toast.error("Failed to reinstate");
            }
          })
        }
      >
        {pending ? "Reinstating..." : "Reinstate"}
      </Button>
    );
  }

  if (isSelf) {
    return (
      <Button variant="outline" size="sm" disabled title="You can't suspend your own account">
        Suspend
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Suspend</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {email}?</DialogTitle>
          <DialogDescription>
            They&apos;ll be signed out immediately and won&apos;t be able to sign in again until you reinstate them.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await suspendUser(userId);
                  toast.success(`Suspended ${email}`);
                  setOpen(false);
                } catch {
                  toast.error("Failed to suspend");
                }
              })
            }
          >
            {pending ? "Suspending..." : "Suspend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
