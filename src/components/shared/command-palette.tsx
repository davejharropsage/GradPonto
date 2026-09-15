"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  CalendarClock,
  Sparkles,
  FileCheck2,
  Building2,
  Plus,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getSearchIndex, type SearchResults } from "@/lib/actions/search";

const quickActions = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Applications", href: "/applications", icon: Briefcase },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Deadlines", href: "/deadlines", icon: CalendarClock },
  { label: "Analyse a Job", href: "/analyse-job", icon: Sparkles },
  { label: "Check My CV", href: "/check-cv", icon: FileCheck2 },
  { label: "Companies", href: "/employers", icon: Building2 },
  { label: "New Application", href: "/applications/new", icon: Plus },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        const target = e.target as HTMLElement | null;
        const isTyping =
          target && ["INPUT", "TEXTAREA"].includes(target.tagName);
        if (e.key === "/" && isTyping) return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    function handleOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("open-command-palette", handleOpenRequest);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (open && !results) {
      getSearchIndex().then(setResults);
    }
  }, [open, results]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search PlacementPilot"
      description="Jump to a page, application, or company"
    >
      <Command>
        <CommandInput placeholder="Search applications, companies, or pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem key={action.href} onSelect={() => go(action.href)}>
                  <Icon className="h-4 w-4" />
                  {action.label}
                </CommandItem>
              );
            })}
          </CommandGroup>

          {results && results.applications.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Applications">
                {results.applications.map((app) => (
                  <CommandItem
                    key={app.id}
                    onSelect={() => go(`/applications/${app.id}`)}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="flex-1 truncate">
                      {app.employerName ? `${app.employerName}: ${app.title}` : app.title}
                    </span>
                    {app.archived && (
                      <span className="shrink-0 text-xs text-muted-foreground">Archived</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {results && results.employers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Companies">
                {results.employers.map((employer) => (
                  <CommandItem
                    key={employer.id}
                    onSelect={() => go(`/employers/${employer.id}`)}
                  >
                    <Building2 className="h-4 w-4" />
                    {employer.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
