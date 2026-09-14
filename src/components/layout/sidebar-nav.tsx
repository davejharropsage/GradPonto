"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navLinks, comingSoonLinks } from "./nav-links";
import { Badge } from "@/components/ui/badge";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navLinks.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}

      <div className="mt-2 border-t pt-2">
        {comingSoonLinks.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{link.label}</span>
              <Badge variant="outline" className="text-[10px] text-muted-foreground/70">
                Soon
              </Badge>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
