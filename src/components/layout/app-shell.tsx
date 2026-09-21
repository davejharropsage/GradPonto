"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "@/components/brand/brand";
import { signOutAction } from "@/lib/actions/auth";
import { SidebarNav } from "./sidebar-nav";
import { HeaderSearch } from "./header-search";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "@/components/shared/command-palette";

export interface ShellUser {
  name: string | null;
  email: string;
  university: string | null;
}

function initials(user: ShellUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}

function UserCard({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#79c5cd] to-[#5e84e2] text-sm font-extrabold text-[#202128]"
      >
        {initials(user)}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold">{user.name ?? user.email}</div>
        <div className="truncate text-xs text-white/60">{user.university ?? user.email}</div>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  children,
  proCard,
  user,
}: {
  children: React.ReactNode;
  proCard: React.ReactNode;
  user: ShellUser;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <CommandPalette />
      <aside className="dark sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex print:hidden">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Brand tone="light" subtitle="Application tracker" />
        </div>
        <div className="px-3 pt-3">
          <HeaderSearch />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="space-y-3 border-t border-sidebar-border p-3">
          <UserCard user={user} />
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
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 print:hidden">
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
                <Brand tone="light" subtitle="Application tracker" />
              </div>
              <div className="px-3 pt-3">
                <HeaderSearch />
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="space-y-3 p-3">
                <UserCard user={user} />
                {proCard}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="md:hidden" aria-label="GradPonto home">
            <Brand size={30} />
          </Link>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <ThemeToggle />
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
