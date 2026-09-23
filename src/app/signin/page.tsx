import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/signin-form";
import { OrDivider, ProviderButtons } from "@/components/auth/provider-buttons";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ suspended?: string; reset?: string }>;
}) {
  // Already signed in? Skip straight on.
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  const { suspended, reset } = await searchParams;

  return (
    <AuthShell>
      {suspended && (
        <p className="mb-6 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Your account has been suspended. Contact support if you think this is a mistake.
        </p>
      )}
      {reset && (
        <p className="mb-6 rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-center text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Your password has been reset. Sign in with your new password.
        </p>
      )}
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Welcome back</h1>
        <p className="mt-3 text-[#62646d]">Sign in to GradPonto.</p>
      </div>

      <div className="mt-8">
        <ProviderButtons />
        <OrDivider />
        <SignInForm />
        <p className="mt-6 text-center text-sm text-[#62646d]">
          New to GradPonto?{" "}
          <Link href="/signup" className="font-semibold text-[#476adb] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
