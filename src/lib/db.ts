import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
