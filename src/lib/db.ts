import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

// The generated client has no native query engine at all (see engineType = "client" in
// schema.prisma) — it runs queries through this driver adapter instead. Neon's serverless driver
// talks WebSocket, which Node needs a ws-backed constructor for (browsers/edge have one built in).
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
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
