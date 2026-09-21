"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestCodeAction } from "@/lib/actions/auth";

/**
 * Step 1: type an email, get a code. Used on the sign-in page and on the landing page.
 * `tone="dark"` styles it for use on the dark call-to-action panel.
 */
export function EmailForm({
  buttonLabel = "Continue with email",
  tone = "light",
}: {
  buttonLabel?: string;
  tone?: "light" | "dark";
}) {
  const [state, action, pending] = useActionState(requestCodeAction, undefined);
  const [email, setEmail] = useState("");
  const inputId = useId();
  const errorId = useId();

  return (
    <form action={action} noValidate className="space-y-3">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <Input
        id={inputId}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@university.ac.uk"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? errorId : undefined}
        className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
      />
      {state?.error && (
        <p id={errorId} role="alert" className={tone === "dark" ? "text-sm text-[#ffb4b4]" : "text-sm text-destructive"}>
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending || email.trim().length === 0}
        className={
          tone === "dark"
            ? "h-12 w-full rounded-[10px] bg-white text-[#202128] hover:bg-[#e9eef8]"
            : "h-12 w-full rounded-[10px]"
        }
      >
        {pending ? "Sending your code…" : buttonLabel}
      </Button>
    </form>
  );
}
