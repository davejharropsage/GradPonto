import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logError, reportError } from "@/lib/monitoring";

/**
 * Next.js redacts a thrown Error's message in production before it reaches the client — great for
 * accidental leaks, but it also silently ate every deliberate "here's what you did wrong" message
 * (e.g. "Paste a job description first"), replacing them with an opaque digest the browser can't
 * show. Server actions that have user-facing failures return one of these instead of throwing, so
 * the real message survives the trip. unstable_rethrow lets Next's own control-flow throws
 * (redirect(), notFound()) pass through untouched.
 *
 * Because the error is caught here, Next never sees it, so this is also where it gets logged:
 * - a plain `Error` is how actions say "here's what you did wrong" — logged, not alerted;
 * - anything else (a database error, a TypeError, an AI outage) is a real failure — logged and
 *   emailed to the owner (lib/monitoring.ts).
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function tryAction<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    // Prisma's "record not found": something was deleted (often in another tab) — not a fault.
    if (typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2025") {
      logError(`action ${name}`, error);
      return { ok: false, error: "That item no longer exists. Refresh the page and try again." };
    }
    if (error instanceof Error && error.constructor === Error) logError(`action ${name}`, error);
    // AI provider failures already alert from lib/ai/client.ts; don't send a second email for each.
    else if (error instanceof Error && (error.name === "AiRequestError" || error.name === "AiNotConfiguredError")) logError(`action ${name}`, error);
    else await reportError(`action ${name}`, error);
    // Unexpected errors get a generic message: their own may contain internals (SQL, file paths).
    const expected = error instanceof Error && (error.constructor === Error || error.name.startsWith("Ai"));
    return { ok: false, error: expected ? (error as Error).message : "Something went wrong on our side. Please try again in a moment." };
  }
}
