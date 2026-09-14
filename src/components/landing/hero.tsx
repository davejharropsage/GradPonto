import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

export function Hero() {
  return (
    <section className="bg-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-mono text-xs uppercase tracking-wide text-accent-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
            Built for placement &amp; graduate job hunting
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Land the placement.
            <br />
            Skip the busywork.
          </h1>

          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Track every application, tailor your CV and cover letter with AI, and never miss a deadline — all in one
            board that runs entirely on your own device.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="#signup" size="lg">
              Sign up — free
            </LinkButton>
            <LinkButton href="#features" variant="outline" size="lg">
              See how it works
            </LinkButton>
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            No credit card &middot; Your data stays on your device &middot; Free plan, forever
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_30px_60px_-20px_rgba(10,31,20,0.26)]">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">my-applications</span>
            </div>
            <div className="flex h-72 items-center justify-center bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,var(--border)_10px,var(--border)_11px)]">
              <div className="rounded-full bg-background/80 px-4 py-1.5 font-mono text-xs text-muted-foreground">
                pipeline board preview
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-4 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_-14px_rgba(10,31,20,0.24)] sm:right-6">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">CV match</p>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-accent-foreground">86%</span>
              <span className="flex items-center gap-1 text-xs font-medium text-accent-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                +12 after edits
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
