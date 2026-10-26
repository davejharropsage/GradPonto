import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // pg opens real Node sockets, which Next's server bundler can mishandle — keeping it (and the
  // Prisma adapter built on it) as a plain Node `require` avoids bundling-related runtime failures.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

// Sentry's build step. Error reporting itself is switched on at runtime by NEXT_PUBLIC_SENTRY_DSN
// (src/lib/sentry-options.ts); this only adds what has to happen at build time:
// - uploading source maps, so stack traces show real file names and lines. Needs SENTRY_AUTH_TOKEN,
//   SENTRY_ORG and SENTRY_PROJECT at build time; without them the build still succeeds, just
//   without the upload.
// - the /monitoring route, which relays browser error reports through this site so ad-blockers
//   don't drop them (allowed through in src/proxy.ts).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Build logs only on CI (Vercel sets CI=1), where they're useful for checking the upload.
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  // Upload maps for every client chunk, not just the app's own, so framework frames resolve too.
  widenClientFileUpload: true,
  // Don't serve the uploaded source maps publicly.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
