"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/actions/auth";

/** Email + password, one step. */
export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

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
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? errorId : undefined}
        className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
      />

      {state?.error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !email.trim() || !password} className="h-12 w-full rounded-[10px]">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-right text-sm">
        <Link href="/forgot-password" className="font-semibold text-[#476adb] hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
