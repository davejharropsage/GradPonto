import type { Instrumentation } from "next";

/**
 * Every server error Next.js catches (pages, server actions, route handlers, the proxy) is logged
 * and emailed to the owner — see lib/monitoring.ts for who gets it and how often. Errors that are
 * caught and handled in our own code (and turned into a friendly message) are reported where
 * they're caught instead.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // Alerts send email and touch the database, which only work in the Node.js runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("@/lib/monitoring");
  await reportError(`${context.routeType} ${context.routePath}`, error, {
    method: request.method,
    // The path only — the query string can carry things like reset codes.
    path: request.path.split("?")[0],
  });
};
