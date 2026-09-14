import { Check } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

const points = [
  "Keyword and skills gaps flagged line by line",
  "Rewrite suggestions you can accept in one click",
  "Works from a CV you already have on file — no re-uploading per job",
];

export function CvSpotlight() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent-foreground">CV review</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Scored against the actual job spec
          </h2>
          <p className="mt-3 text-muted-foreground">
            Paste any placement listing. PlacementPilot reads it, checks it against your CV, and tells you exactly
            which lines to rewrite — then drafts a cover letter tailored to that role.
          </p>

          <ul className="mt-6 space-y-2.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <LinkButton href="/check-cv" variant="link" className="mt-5 h-auto px-0 text-accent-foreground">
            Score my CV →
          </LinkButton>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-border bg-muted">
          <div className="flex h-80 items-center justify-center bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,var(--border)_10px,var(--border)_11px)]">
            <div className="rounded-full bg-background/80 px-4 py-1.5 font-mono text-xs text-muted-foreground">
              CV review panel preview
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
