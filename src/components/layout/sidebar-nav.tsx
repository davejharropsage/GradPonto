"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections, comingSoonLinks } from "./nav-links";

const row = "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold transition-colors";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/40">{children}</p>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 p-3">
      {navSections.map((section, index) => (
        <div key={section.label ?? "top"} className="flex flex-col gap-0.5">
          {section.label ? <SectionLabel>{section.label}</SectionLabel> : null}
          {section.links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  row,
                  active ? "bg-white/[0.13] text-white" : "text-white/75 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                <Icon
                  className={cn("h-[17px] w-[17px] shrink-0", active ? "text-[#79c5cd]" : "text-white/55 group-hover:text-white/85")}
                  strokeWidth={active ? 2.2 : 1.9}
                />
                {link.label}
              </Link>
            );
          })}
          {index === 0 && <div className="mx-1 mt-2 h-px bg-white/10" />}
        </div>
      ))}

      <div className="flex flex-col gap-0.5">
        <SectionLabel>Insights</SectionLabel>
        {comingSoonLinks.map((link) => {
          const Icon = link.icon;
          return (
            <div key={link.label} className={cn(row, "cursor-not-allowed text-white/35")} aria-disabled="true">
              <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
              <span className="flex-1">{link.label}</span>
              <span className="rounded-full border border-white/20 px-1.5 py-px text-[10px] font-bold text-white/50">Soon</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
