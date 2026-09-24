import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Plain TCP Postgres (node-postgres), not the WebSocket-based Neon serverless driver we tried
  // first: that route (@prisma/adapter-neon + ws) kept throwing a malformed, non-Error object on
  // Vercel specifically — a known rough edge with ws's optional native addons not surviving
  // serverless bundling — even though the exact same connection string worked fine locally. Plain
  // `pg` talks ordinary TCP, which has none of that; Neon's pooled connection string (PgBouncer,
  // already what DATABASE_URL points at) works with it exactly as it would with any other host.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

/**
 * The RAW Prisma client. It knows nothing about users, so a query made with it
 * can read or change anyone's data.
 *
 * Only the authentication code in `src/lib/auth/**` may import this. Everything
 * else must get its client from `userDb()` (`@/lib/auth/user`), which is scoped
 * to the signed-in user. This is named `prisma` (not `db`) on purpose: any code
 * that still does `import { db }` fails to compile, so nothing can quietly
 * bypass the scoping.
 */
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
