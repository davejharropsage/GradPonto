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
      className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="rounded border border-white/25 px-1.5 py-px font-mono text-[10px] text-white/50">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
