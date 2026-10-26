import type { Instrumentation } from "next";
import { sentryEnabled, sentryOptions, stripQuery } from "@/lib/sentry-options";

/** Starts Sentry in the Node.js and edge server runtimes, when NEXT_PUBLIC_SENTRY_DSN is set. */
export async function register() {
  if (!sentryEnabled()) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init(sentryOptions());
  }
}

/**
 * Every server error Next.js catches (pages, server actions, route handlers, the proxy). With Sentry
 * on, it goes to Sentry (grouped, with stack traces) and is logged; without it, it's logged and
 * emailed to the owner — see lib/monitoring.ts for who gets it and how often. Errors that are caught
 * and handled in our own code are reported where they're caught instead.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (sentryEnabled()) {
    const Sentry = await import("@sentry/nextjs");
    // Sentry's own handler: it records the route and render context with the error. Given the path
    // without its query string, which can carry reset codes or email addresses.
    Sentry.captureRequestError(error, { ...request, path: stripQuery(request.path) }, context);
  }
  // Logging and alert emails send email and touch the database: Node.js runtime only.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError, reportError } = await import("@/lib/monitoring");
  if (sentryEnabled()) {
    logError(`${context.routeType} ${context.routePath}`, error, { method: request.method, path: stripQuery(request.path) });
    return;
  }
  await reportError(`${context.routeType} ${context.routePath}`, error, {
    method: request.method,
    // The path only — the query string can carry things like reset codes.
    path: stripQuery(request.path),
  });
};
