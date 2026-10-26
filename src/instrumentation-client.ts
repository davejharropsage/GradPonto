import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

// Browser-side Sentry: uncaught errors and rejected promises in people's browsers, which the
// server never sees. A no-op until NEXT_PUBLIC_SENTRY_DSN is set. No Session Replay: recording
// students' screens isn't something to switch on without a privacy review.
Sentry.init(sentryOptions());

// Lets Sentry tie performance traces to client-side page navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
