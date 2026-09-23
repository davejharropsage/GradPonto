"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendResetCodeAction, resetPasswordAction } from "@/lib/actions/auth";

/** Code + new password + confirm, one form — resetting needs more than just the code. */
export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const codeId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const errorId = useId();

  const [resendState, resendAction, resending] = useActionState(resendResetCodeAction, undefined);

  const canSubmit = code.length === 6 && password.length >= 8 && confirmPassword.length > 0;

  return (
    <div className="space-y-4">
      <form action={action} noValidate className="space-y-3">
        <label htmlFor={codeId} className="sr-only">
          6-digit code
        </label>
        <Input
          id={codeId}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-14 rounded-[10px] border-[#a2a9b8] bg-white text-center font-mono text-3xl font-bold tracking-[0.5em] text-[#202128] placeholder:text-[#62646d]/40"
        />

        <label htmlFor={passwordId} className="sr-only">
          New password
        </label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="New password (at least 8 characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-[10px] border-[#a2a9b8] bg-white px-4 text-base text-[#202128] placeholder:text-[#62646d]/70"
        />

        <label htmlFor={confirmId} className="sr-only">
          Confirm new password
        </label>
        <Input
          id={confirmId}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
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
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <form action={resendAction}>
        <button
          type="submit"
          disabled={resending}
          className="text-sm font-semibold text-[#476adb] hover:underline disabled:cursor-not-allowed disabled:text-[#62646d]"
        >
          {resending ? "Sending…" : "Send a new code"}
        </button>
      </form>

      <div aria-live="polite" className="min-h-5 text-sm">
        {resendState?.notice && <p className="text-[#006b3c]">{resendState.notice}</p>}
        {resendState?.error && <p className="text-destructive">{resendState.error}</p>}
      </div>
    </div>
  );
}
