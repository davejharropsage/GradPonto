import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CodeForm } from "@/components/auth/code-form";
import { AUTH } from "@/lib/auth/config";
import { mailMode } from "@/lib/auth/mailer";
import { OAUTH_COOKIES, readPendingLink } from "@/lib/auth/oauth";
import { signedInDestination } from "@/lib/auth/user";
import { changeSignupEmailAction, resendSignupCodeAction, verifySignupAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Verify your email" };

export default async function SignUpVerifyPage() {
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  // No address to verify (cookie expired, or someone came straight here): start again.
  const store = await cookies();
  const email = store.get(AUTH.emailCookie)?.value;
  if (!email) redirect("/signup");

  // Arrived from "Continue with Google/Microsoft": say why there's still a code to enter.
  const oauth = readPendingLink(store.get(OAUTH_COOKIES.pending)?.value);
  const providerName = oauth?.email === email ? { google: "Google", microsoft: "Microsoft" }[oauth.provider] : null;

  const devInbox = process.env.NODE_ENV !== "production" && mailMode() === "dev-outbox";

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Check your email</h1>
        <p className="mt-3 text-[#62646d]">
          We sent a 6-digit code to <strong className="break-words text-[#202128]">{email}</strong>. It expires in{" "}
          {AUTH.codeTtlMinutes} minutes.
        </p>
        {providerName && (
          <p className="mt-2 text-sm text-[#62646d]">
            This confirms your email once, to finish creating your account with {providerName}. After this, you can
            sign in with {providerName} directly.
          </p>
        )}
      </div>

      <div className="mt-8">
        <CodeForm
          verifyAction={verifySignupAction}
          resendAction={resendSignupCodeAction}
          changeEmailAction={changeSignupEmailAction}
        />

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
