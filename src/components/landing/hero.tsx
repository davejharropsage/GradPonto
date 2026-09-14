import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #a78bfa 0%, transparent 45%), radial-gradient(circle at 70% 60%, #fbbf24 0%, transparent 45%), radial-gradient(circle at 50% 90%, #34d399 0%, transparent 45%)",
        }}
      />

      <div className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Built for placement &amp; graduate job hunting
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          The command centre for your{" "}
          <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
            placement search
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Track every application, tailor your CV and cover letter with AI, and never miss a deadline — all in one
          board that runs entirely on your own device.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton href="#signup" size="lg" className="px-8">
            Get started free
          </LinkButton>
          <LinkButton href="#features" variant="outline" size="lg" className="px-8">
            See how it works
          </LinkButton>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["No credit card required", "Your data stays on your device", "Free plan, forever"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
