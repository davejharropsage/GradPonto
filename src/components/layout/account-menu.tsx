"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, LogOut, Rocket, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { initials, type ShellUser } from "./shell-user";

/** Top-right account menu: who you are, your account page, and sign out. */
export function AccountMenu({ user }: { user: ShellUser }) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-9 items-center gap-2 rounded-lg py-0 pl-1 pr-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted md:pr-2"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#79c5cd] to-[#5e84e2] text-[11px] font-extrabold text-[#202128]"
        >
          {initials(user)}
        </span>
        <span className="hidden max-w-[170px] text-left leading-tight md:block">
          <span className="block truncate text-[13px] font-semibold">{user.name ?? user.email}</span>
          {user.university && <span className="block truncate text-[11px] text-muted-foreground">{user.university}</span>}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate text-sm font-semibold text-foreground">{user.name ?? "Your account"}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            {user.university && <span className="block truncate text-xs font-normal text-muted-foreground">{user.university}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />} className="px-2 py-1.5">
          <UserRound />
          Account &amp; plan
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/landing" />} className="px-2 py-1.5">
          <Rocket />
          View landing page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="px-2 py-1.5"
          onClick={() =>
            startTransition(async () => {
              await signOutAction();
            })
          }
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
