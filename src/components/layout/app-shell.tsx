"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "@/components/brand/brand";
import { CommandPalette } from "@/components/shared/command-palette";
import { AccountMenu } from "./account-menu";
import { HeaderSearch } from "./header-search";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UpgradeButton } from "./upgrade-button";
import type { ShellUser } from "./shell-user";

export type { ShellUser } from "./shell-user";

/**
 * Layout: a slim left menu that is only navigation (brand, search, grouped links), and a top bar
 * on the right holding the plan control, theme toggle and account menu. Keeping account and
 * upgrade out of the sidebar gives the menu the full column height.
 */
export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <CommandPalette />

      <aside className="dark sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex print:hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
          <Link href="/" aria-label="GradPonto dashboard">
            <Brand tone="light" size={30} />
          </Link>
        </div>
        <div className="px-3 pt-3">
          <HeaderSearch />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/90 px-3 backdrop-blur md:px-5 print:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="dark w-64 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                <Brand tone="light" size={30} />
              </div>
              <div className="px-3 pt-3">
                <HeaderSearch />
              </div>
              <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link href="/" className="md:hidden" aria-label="GradPonto dashboard">
            <Brand size={28} />
          </Link>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <UpgradeButton plan={user.plan} />
            <ThemeToggle />
            <AccountMenu user={user} />
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
