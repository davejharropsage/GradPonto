// Shared Sentry settings for the browser (src/instrumentation-client.ts) and the server and edge
// runtimes (src/instrumentation.ts). No "server-only" and no imports, so the browser bundle can use
// it and tests/sentry.test.ts can run it under plain node:test.
//
// Sentry stays OFF until NEXT_PUBLIC_SENTRY_DSN is set (NEXT_PUBLIC_ because the browser needs it
// too; a DSN only lets you send events, it's not a secret). Choose Sentry's EU region when creating
// the project: the DSN then points at the EU ingest host and nothing here changes.

/** The subset of a Sentry event this file reads or changes; kept local so it needs no SDK types. */
interface ScrubbableEvent {
  user?: unknown;
  request?: {
    url?: string;
    query_string?: unknown;
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, string>;
  };
  breadcrumbs?: { data?: Record<string, unknown> }[];
  contexts?: Record<string, Record<string, unknown> | undefined>;
  spans?: { data?: Record<string, unknown> }[];
}

export function sentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

export function sentryEnabled(): boolean {
  return Boolean(sentryDsn());
}

// Headers that can carry credentials or identify a person.
const DROP_HEADERS = new Set(["cookie", "authorization", "x-forwarded-for", "x-real-ip", "forwarded", "cf-connecting-ip"]);

/** A URL without its query string or fragment: those can carry reset codes, tokens or email addresses. */
export function stripQuery(url: string): string {
  return url.replace(/[?#].*$/, "");
}

// Keys whose string values are URLs or paths (query stripped), and keys that are only a query.
const URL_KEYS = new Set(["url", "from", "to", "request_path", "http.url", "url.full", "http.target", "url.path"]);
const QUERY_KEYS = new Set(["url.query", "http.query", "query_string"]);

function scrubData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (QUERY_KEYS.has(key)) delete data[key];
    else if (URL_KEYS.has(key) && typeof value === "string") data[key] = stripQuery(value);
  }
}

/**
 * Removes personal data before an event leaves the app (UK GDPR: send the error, not the person).
 * Strips cookies, auth and IP headers, request bodies and any user object, and query strings from
 * every URL-like field: the request, navigation/fetch breadcrumbs, contexts and performance spans.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    if (event.request.headers) {
      for (const name of Object.keys(event.request.headers)) {
        if (DROP_HEADERS.has(name.toLowerCase())) delete event.request.headers[name];
      }
    }
  }
  for (const crumb of event.breadcrumbs ?? []) scrubData(crumb.data);
  // e.g. contexts.nextjs.request_path, which Sentry's request hook fills from the raw path.
  for (const context of Object.values(event.contexts ?? {})) scrubData(context);
  for (const span of event.spans ?? []) scrubData(span.data);
  return event;
}

/** Options common to every runtime. */
export function sentryOptions() {
  return {
    dsn: sentryDsn(),
    enabled: sentryEnabled(),
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Never attach IP addresses, cookies or user details automatically.
    sendDefaultPii: false,
    // A tenth of requests get performance traces: enough to spot slow pages, cheap on the free plan.
    tracesSampleRate: 0.1,
    // Send each trace as one transaction (not streamed span by span), so beforeSendTransaction below
    // scrubs it: with the SDK's default 'stream' lifecycle, that hook is silently skipped and span
    // URLs would leave with their query strings.
    traceLifecycle: "static" as const,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  };
}
