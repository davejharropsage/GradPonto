"use client";

import { useEffect } from "react";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
export const UTM_STORAGE_KEY = "utm-params";

// Reads utm_* query params on first landing and remembers them in local
// storage, so they're still attributable when the visitor signs up later in
// the same browser (not necessarily on the exact page they arrived on).
export function UtmCapture() {
  useEffect(() => {
    try {
      if (localStorage.getItem("cookie-consent") === "declined") return;

      const params = new URLSearchParams(window.location.search);
      const captured: Record<string, string> = {};
      for (const key of UTM_KEYS) {
        const value = params.get(key);
        if (value) captured[key] = value;
      }
      if (Object.keys(captured).length > 0) {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
      }
    } catch {
      // localStorage can be unavailable — attribution is best-effort only.
    }
  }, []);

  return null;
}
