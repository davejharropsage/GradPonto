import { KanbanSquare, CalendarClock, Sparkles, FileCheck2, FileText, LockKeyhole } from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban pipeline",
    description: "Drag applications through Interested, Applied, Assessment, Interview, and Offer.",
    bg: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  },
  {
    icon: CalendarClock,
    title: "Smart deadlines",
    description: "Overdue and upcoming deadlines surface automatically, grouped and colour-coded.",
    bg: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  },
  {
    icon: Sparkles,
    title: "AI job analysis",
    description: "Paste a link or description and get the role, company, salary, and deadline extracted instantly.",
    bg: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
  },
  {
    icon: FileCheck2,
    title: "CV match checker",
    description: "See how well your CV fits a specific role, with concrete suggestions to improve it.",
    bg: "bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400",
  },
  {
    icon: FileText,
    title: "Tailored documents",
    description: "AI-assisted CV and cover letter tailoring per application, exported straight to PDF.",
    bg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: LockKeyhole,
    title: "100% local",
    description: "Everything runs on your own machine with a local database — nothing is uploaded to the cloud.",
    bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything your placement search needs</h2>
        <p className="mt-3 text-muted-foreground">One board instead of five spreadsheets, a notes app, and a folder of CV versions.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="rounded-2xl border bg-card p-6">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
