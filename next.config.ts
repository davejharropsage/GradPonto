import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg opens real Node sockets, which Next's server bundler can mishandle — keeping it (and the
  // Prisma adapter built on it) as a plain Node `require` avoids bundling-related runtime failures.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
