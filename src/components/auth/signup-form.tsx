"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/lib/actions/auth";

/** Email + password + confirm. Creates the account (unverified) and moves to the code step. */
export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const errorId = useId();

  const canSubmit = email.trim().length > 0 && password.length >= 8 && confirmPassword.length > 0;

  return (
    <form action={action} noValidate className="space-y-3">
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      <Input
        id={emailId}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@university.ac.uk"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={state?.error ? true : undefined}
        className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
      />

      <label htmlFor={passwordId} className="sr-only">
        Password
      </label>
      <Input
        id={passwordId}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={state?.error ? true : undefined}
        className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
      />

      <label htmlFor={confirmId} className="sr-only">
        Confirm password
      </label>
      <Input
        id={confirmId}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? errorId : undefined}
        className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
      />

      {state?.error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !canSubmit} className="h-12 w-full rounded-[10px]">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
