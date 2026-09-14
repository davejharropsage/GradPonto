import { KanbanSquare, CalendarClock, Sparkles, FileCheck2, FileText, LockKeyhole } from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Application board",
    description: "Interested, Applied, Assessment, Interview, Offer. Drag a card between stages as it moves.",
  },
  {
    icon: CalendarClock,
    title: "Deadline calendar",
    description: "Overdue and upcoming deadlines surface automatically, grouped and colour-coded.",
  },
  {
    icon: Sparkles,
    title: "AI job analysis",
    description: "Paste a link or description and get the role, company, salary, and deadline extracted instantly.",
  },
  {
    icon: FileCheck2,
    title: "CV match score",
    description: "See how your CV reads against the real job spec, with concrete lines to rewrite.",
  },
  {
    icon: FileText,
    title: "Tailored documents",
    description: "AI-assisted CV and cover letter tailoring per application, exported straight to PDF.",
  },
  {
    icon: LockKeyhole,
    title: "100% local",
    description: "Everything runs on your own machine with a local database — nothing uploaded to the cloud.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="bg-[#0a1f14] py-20 text-[#f2f7f3] sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-wide text-[#6ee6a2]">Everything in one place</p>
        <h2 className="mt-2 max-w-lg text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your whole placement hunt, on one board
        </h2>
        <p className="mt-3 max-w-md text-[#a9bdb1]">
          No more spreadsheet, twelve browser tabs, and a folder of CV versions called final_FINAL_v3.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-[#122e20] p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6ee6a2] text-[#052b16]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-[#a9bdb1]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
