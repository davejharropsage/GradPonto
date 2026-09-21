import Link from "next/link";
import { Brand } from "@/components/brand/brand";

/** Centred card on a soft ice-blue wash: the frame for every sign-in step. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f5f7fb] px-4 py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(121,197,205,0.28),transparent_70%),radial-gradient(50%_45%_at_0%_100%,rgba(134,193,89,0.16),transparent_70%)]"
      />
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/landing" aria-label="GradPonto home">
          <Brand />
        </Link>
        <Link href="/landing" className="text-sm font-semibold text-[#62646d] hover:text-[#202128]">
          Back to home
        </Link>
      </header>

      <main id="main-content" className="relative flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[480px] rounded-3xl bg-white p-7 shadow-[0_30px_60px_-30px_rgba(32,33,40,0.25)] sm:p-10">
          {children}
        </div>
      </main>

      <footer className="relative mx-auto w-full max-w-5xl pb-2 text-center text-xs text-[#62646d]">
        <Link href="/terms" className="hover:underline">Terms</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
      </footer>
    </div>
  );
}
