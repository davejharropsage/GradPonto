import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = { title: "Finish creating your account" };

export default async function WelcomePage() {
  // Signed in by email code but not registered yet. Anyone already registered goes to the app.
  const user = await requireUser();
  if (user.registeredAt) redirect("/");

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-4xl text-[#202128] sm:text-5xl">Nearly there</h1>
        <p className="mt-3 text-[#62646d]">
          You&apos;re signed in as <strong className="break-words text-[#202128]">{user.email}</strong>. Tell us a little about
          yourself to finish creating your account.
        </p>
      </div>

      <div className="mt-8">
        <RegisterForm />
        <p className="mt-6 text-center text-xs leading-relaxed text-[#62646d]">
          We&apos;ll email you a confirmation once your account is ready.
        </p>
      </div>
    </AuthShell>
  );
}
