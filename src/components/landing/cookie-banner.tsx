"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is only possible client-side, after mount
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage can be unavailable (e.g. private browsing) — just skip the banner.
    }
  }, []);

  function respond(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignore — the banner just won't stay dismissed next visit.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-lg print:hidden">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          This site uses local storage to remember your theme preference and, if you follow a marketing link, which
          campaign brought you here. No third-party trackers or advertising cookies are used. See our{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => respond("declined")}>
            Decline
          </Button>
          <Button type="button" size="sm" onClick={() => respond("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
