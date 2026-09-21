import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailForm } from "@/components/auth/email-form";
import { OrDivider, ProviderButtons } from "@/components/auth/provider-buttons";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Sign in or create your account" };

export default async function SignInPage() {
  // Already signed in? Skip straight on.
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Get started with GradPonto</h1>
        <p className="mt-3 text-[#62646d]">Sign in or create your account. Free to start, no credit card needed.</p>
      </div>

      <div className="mt-8">
        <ProviderButtons />
        <OrDivider />
        <EmailForm />
        <p className="mt-6 text-center text-xs leading-relaxed text-[#62646d]">
          By continuing you agree to our{" "}
          <Link href="/terms" className="font-semibold text-[#202128] underline">Terms</Link> and{" "}
          <Link href="/privacy" className="font-semibold text-[#202128] underline">Privacy Policy</Link>. We&apos;ll email you a
          one-time code, so there&apos;s no password to remember.
        </p>
      </div>
    </AuthShell>
  );
}
