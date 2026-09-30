"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pauseAccountAction, deleteAccountAction } from "@/lib/actions/profile";

/** The pause and permanent-deletion options on the Account page. Both sign the browser out on success. */
export function DangerZone({ email }: { email: string }) {
  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pausePending, startPause] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const emailMatches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  // Both actions redirect() on success (to /signin), which Next.js implements by throwing — so
  // this must NOT wrap the call in try/catch, or a successful redirect would be reported as a
  // failure. Same pattern as signOutAction in account-menu.tsx.
  function handlePause() {
    startPause(async () => {
      await pauseAccountAction();
    });
  }

  function handleDelete() {
    if (!emailMatches) return;
    startDelete(async () => {
      await deleteAccountAction();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setPauseOpen(true)}>
          Pause my account
        </Button>
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete my account
        </Button>
      </div>

      <Dialog open={pauseOpen} onOpenChange={(open) => !pausePending && setPauseOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause your account for 30 days?</DialogTitle>
            <DialogDescription>
              You&apos;ll be signed out everywhere right away, and can&apos;t sign back in by accident. Whenever
              you&apos;re ready — tomorrow or in 29 days — just sign in with your password again to pick up exactly
              where you left off. Nothing is deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseOpen(false)} disabled={pausePending}>
              Cancel
            </Button>
            <Button onClick={handlePause} disabled={pausePending}>
              {pausePending ? "Pausing..." : "Pause my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (deletePending) return;
          setDeleteOpen(open);
          if (!open) setConfirmEmail("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account permanently?</DialogTitle>
            <DialogDescription>
              This immediately and permanently deletes your account and everything in it — applications, employers,
              documents, notes and goals. This cannot be undone. If you just want a break, pause your account
              instead.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-email">
              Type your email (<span className="font-medium text-foreground">{email}</span>) to confirm
            </Label>
            <Input
              id="confirm-email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              disabled={deletePending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deletePending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!emailMatches || deletePending}>
              {deletePending ? "Deleting..." : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
