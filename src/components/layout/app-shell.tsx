"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { HeaderSearch } from "./header-search";
import { ThemeToggle } from "./theme-toggle";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Rocket className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold">PlacementPilot</div>
        <div className="text-xs text-muted-foreground">Application tracker</div>
      </div>
    </div>
  );
}

export function AppShell({ children, proCard }: { children: React.ReactNode; proCard: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="dark sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <div className="px-3 pt-3">
          <HeaderSearch />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="space-y-3 border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between px-1">
            <Link href="/landing" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
              <Rocket className="h-3.5 w-3.5" />
              View landing page
            </Link>
            <ThemeToggle />
          </div>
          {proCard}
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="dark w-64 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-sidebar-border px-4">
                <Brand />
              </div>
              <div className="px-3 pt-3">
                <HeaderSearch />
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="space-y-3 p-3">{proCard}</div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="font-semibold md:hidden">
            PlacementPilot
          </Link>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
