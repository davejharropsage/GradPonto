import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AUTH } from "@/lib/auth/config";
import { mailMode } from "@/lib/auth/mailer";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ResetPasswordPage() {
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  // No address pending a reset (cookie expired, or someone came straight here): start again.
  const email = (await cookies()).get(AUTH.emailCookie)?.value;
  if (!email) redirect("/forgot-password");

  const devInbox = process.env.NODE_ENV !== "production" && mailMode() === "dev-outbox";

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Reset your password</h1>
        <p className="mt-3 text-[#62646d]">
          We sent a 6-digit code to <strong className="break-words text-[#202128]">{email}</strong>. Enter it below with your new
          password.
        </p>
      </div>

      <div className="mt-8">
        <ResetPasswordForm />

        {devInbox && (
          <div className="mt-6 rounded-2xl bg-[#e9eef8] p-4 text-sm text-[#202128]">
            <p className="font-bold">Development mode</p>
            <p className="mt-1 text-[#62646d]">
              No email service is configured, so nothing was really sent. Read your code in the{" "}
              <Link href="/dev/outbox" target="_blank" className="font-semibold text-[#476adb] underline">
                dev inbox
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
