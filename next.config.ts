import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These do Node-specific things (ws opens real sockets; @neondatabase/serverless and the Prisma
  // adapter built on it aren't meant to be bundled) that Next's server bundler can mishandle —
  // keeping them as plain Node `require`s avoids bundling-related runtime failures on Vercel.
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@prisma/adapter-neon"],
};

export default nextConfig;
