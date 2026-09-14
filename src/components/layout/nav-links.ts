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

export const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/analyse-job", label: "Analyse a Job", icon: Sparkles },
  { href: "/check-cv", label: "Check My CV", icon: FileCheck2 },
  { href: "/employers", label: "Companies", icon: Building2 },
];

// Not built yet — shown disabled with a "Soon" badge, matching the product roadmap.
export const comingSoonLinks = [
  { label: "Analytics", icon: BarChart3 },
  { label: "Goals", icon: Target },
];
