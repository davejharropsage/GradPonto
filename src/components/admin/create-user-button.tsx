"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
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
import { createUserAction } from "@/lib/actions/admin";

/** Admin-only: create an account directly with an email and a password you set, skipping the
 * usual email verification — for beta testers, or as an override for someone who's stuck. */
export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const nameId = useId();
  const universityId = useId();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success("Account created");
      setOpen(false);
      setError(null);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <Button type="button" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Create account
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Ready to sign in immediately with the password you set &mdash; no verification email is sent. For beta
            testers, or as an override for someone who can&apos;t complete signup themselves.
          </DialogDescription>
        </DialogHeader>
        <form id="create-user-form" ref={formRef} onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} name="email" type="email" autoComplete="off" required disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input id={nameId} name="name" required maxLength={80} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={universityId}>University</Label>
            <Input id={universityId} name="university" required maxLength={120} disabled={pending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={passwordId}>Password</Label>
            <Input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={confirmId}>Confirm password</Label>
            <Input
              id={confirmId}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={pending}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" disabled={pending}>
            {pending ? "Creating..." : "Create account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
