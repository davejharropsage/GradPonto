import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { ProviderButtons, OrDivider } from "@/components/auth/provider-buttons";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  const destination = await signedInDestination();
  if (destination) redirect(destination);

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Create your account</h1>
        <p className="mt-3 text-[#62646d]">Free to start, no credit card needed.</p>
      </div>

      <div className="mt-8">
        <ProviderButtons />
        <OrDivider />
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-[#62646d]">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-[#476adb] hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs leading-relaxed text-[#62646d]">
          By continuing you agree to our{" "}
          <Link href="/terms" className="font-semibold text-[#202128] underline">Terms</Link> and{" "}
          <Link href="/privacy" className="font-semibold text-[#202128] underline">Privacy Policy</Link>.
        </p>
      </div>
    </AuthShell>
  );
}
