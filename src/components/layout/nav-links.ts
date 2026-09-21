import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  CalendarClock,
  Sparkles,
  FileCheck2,
  Building2,
  BarChart3,
  Target,
} from "lucide-react";

// The sidebar is grouped so it scans quickly: Dashboard on its own, then labelled sections.
// (Same pages as before, just organised.)
export const navSections = [
  {
    label: null,
    links: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Track",
    links: [
      { href: "/applications", label: "Applications", icon: Briefcase },
      { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
      { href: "/employers", label: "Companies", icon: Building2 },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Prepare",
    links: [
      { href: "/analyse-job", label: "Analyse a Job", icon: Sparkles },
      { href: "/check-cv", label: "Check My CV", icon: FileCheck2 },
    ],
  },
] as const;

// Not built yet: shown disabled with a "Soon" badge, matching the product roadmap.
export const comingSoonLinks = [{ label: "Analytics", icon: BarChart3 }];
