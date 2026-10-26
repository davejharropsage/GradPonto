"use client";

import { Button, buttonVariants } from "@/components/ui/button";

export function SentryTestButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          // Thrown outside React's render, so it's an uncaught browser error, like a real bug in a click handler.
          setTimeout(() => {
            throw new Error("Sentry test: browser error from /admin/sentry-test");
          }, 0);
        }}
      >
        Throw a browser error
      </Button>
      {/* A full page load, so the error happens in the server render. */}
      <a href="/admin/sentry-test?throw=server" className={buttonVariants({ variant: "outline" })}>
        Throw a server error
      </a>
    </div>
  );
}
