"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function HeaderSearch() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigator is only available client-side, after mount
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
      className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded border border-current/30 px-1.5 py-0.5 font-mono text-[10px]">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
