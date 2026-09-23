import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailForm } from "@/components/auth/email-form";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Forgot your password?</h1>
        <p className="mt-3 text-[#62646d]">Enter your email and we&apos;ll send you a code to reset it.</p>
      </div>

      <div className="mt-8">
        <EmailForm action={requestPasswordResetAction} buttonLabel="Send reset code" />
        <p className="mt-6 text-center text-sm text-[#62646d]">
          <Link href="/signin" className="font-semibold text-[#476adb] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
