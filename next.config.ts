import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's generated client lives at src/generated/prisma (not the default node_modules/.prisma),
  // and its native query-engine binary (libquery_engine-rhel-openssl-3.0.x.so.node) is loaded at
  // runtime via a dynamic path lookup, not a static import — so Next.js's automatic file tracing
  // for serverless functions doesn't detect it as a dependency and leaves it out of the deployed
  // bundle. This forces it to always be included, for every route.
  outputFileTracingIncludes: {
    "/**": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
