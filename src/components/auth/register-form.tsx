"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/actions/auth";

/** Step 3 (new people only): name and university, then the account is created. */
export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");

  return (
    <form action={action} noValidate className="space-y-5">
      <div className="grid gap-1.5">
        <Label htmlFor="name" className="text-sm font-semibold">Your name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          maxLength={80}
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128]"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="university" className="text-sm font-semibold">University</Label>
        <Input
          id="university"
          name="university"
          autoComplete="organization"
          maxLength={120}
          placeholder="e.g. University of Leeds"
          value={university}
          onChange={(event) => setUniversity(event.target.value)}
          className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending || name.trim().length === 0 || university.trim().length === 0}
        className="h-12 w-full rounded-[10px]"
      >
        {pending ? "Creating your account…" : "Create my account"}
      </Button>
    </form>
  );
}
