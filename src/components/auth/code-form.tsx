"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeEmailAction, resendCodeAction, verifyCodeAction } from "@/lib/actions/auth";

const RESEND_WAIT_SECONDS = 30;

/** Step 2: type the 6-digit code from the email. Submits by itself as soon as six digits are in. */
export function CodeForm() {
  const [verifyState, verifyAction, verifying] = useActionState(verifyCodeAction, undefined);
  const [code, setCode] = useState("");
  const inputId = useId();
  const errorId = useId();

  // A code was only just emailed, so "send a new code" starts on a short cooldown that matches
  // the one the server enforces. The countdown is derived from a timestamp, ticked once a second.
  const [cooldownEndsAt, setCooldownEndsAt] = useState(() => Date.now() + RESEND_WAIT_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const secondsLeft = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000));

  const [resendState, resendAction, resending] = useActionState(async () => {
    const result = await resendCodeAction();
    if (result?.notice) {
      setNow(Date.now());
      setCooldownEndsAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
    }
    return result;
  }, undefined);

  return (
    <div className="space-y-4">
      <form action={verifyAction} noValidate className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          6-digit code
        </label>
        <Input
          id={inputId}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          autoFocus
          value={code}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(digits);
            if (digits.length === 6) event.currentTarget.form?.requestSubmit();
          }}
          aria-invalid={verifyState?.error ? true : undefined}
          aria-describedby={verifyState?.error ? errorId : undefined}
          className="h-14 rounded-[10px] border-[#a2a9b8] bg-white text-center font-mono text-3xl font-bold tracking-[0.5em] text-[#202128] placeholder:text-[#62646d]/40"
        />
        {verifyState?.error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {verifyState.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={verifying || code.length !== 6} className="h-12 w-full rounded-[10px]">
          {verifying ? "Checking…" : "Continue"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <form action={resendAction}>
          <button
            type="submit"
            disabled={resending || secondsLeft > 0}
            className="font-semibold text-[#476adb] hover:underline disabled:cursor-not-allowed disabled:text-[#62646d] disabled:no-underline"
          >
            {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : resending ? "Sending…" : "Send a new code"}
          </button>
        </form>
        <form action={changeEmailAction}>
          <button type="submit" className="font-semibold text-[#62646d] hover:text-[#202128] hover:underline">
            Use a different email
          </button>
        </form>
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {resendState?.notice && <p className="text-[#006b3c]">{resendState.notice}</p>}
        {resendState?.error && <p className="text-destructive">{resendState.error}</p>}
      </div>
    </div>
  );
}
