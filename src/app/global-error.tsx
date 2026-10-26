"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * The last-resort error page: shown when a page crashes and nothing closer catches it. It replaces
 * the root layout, so it brings its own <html>/<body> and inline styles (globals.css isn't loaded).
 *
 * A crash that started in the browser is sent to Sentry from here. One that started on the server
 * arrives with a `digest` and was already reported there (src/instrumentation.ts), so it isn't sent
 * twice.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";

  useEffect(() => {
    if (!digest) Sentry.captureException(error);
  }, [error, digest]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "16px",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 20px", opacity: 0.75, lineHeight: 1.5 }}>
            Sorry, that page hit an error. Try again, or head back to your dashboard.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid currentColor", background: "transparent", color: "inherit", cursor: "pointer", font: "inherit" }}
            >
              Try again
            </button>
            {/* A full page load on purpose: the app's layout is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ padding: "8px 16px", borderRadius: 8, color: "inherit", font: "inherit" }}>
              Go to dashboard
            </a>
          </div>
          {digest && <p style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Error reference: {digest}</p>}
        </main>
      </body>
    </html>
  );
}
