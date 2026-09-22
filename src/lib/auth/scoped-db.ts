import "server-only";
import { prisma } from "@/lib/db";

/** Models whose rows belong to one user (they all have a `userId` column). */
const OWNED_MODELS = new Set([
  "Employer",
  "Application",
  "Document",
  "Goal",
  "Activity",
  "Experience",
  "Education",
  "Skill",
  "Project",
]);

// Operations that take a `where` and must only ever match the user's own rows.
const FILTERED_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * A Prisma client that can only see and change ONE user's data.
 *
 * On every query against a user-owned model it:
 *   - adds `userId = <this user>` to the `where` of reads, updates and deletes
 *   - stamps `userId = <this user>` onto every created row
 *   - refuses to let an update move a row to a different user
 *
 * Get one with `userDb()` from `@/lib/auth/user`. Nested reads (`include`) are not
 * filtered separately; they follow foreign keys, which is safe because every write
 * also goes through this client and callers check that referenced ids are the
 * user's own before linking to them.
 *
 * An operation this file doesn't know how to scope is rejected rather than run
 * unscoped, so a new Prisma feature can never silently bypass the filter.
 */
export function scopedDb(userId: string) {
  return prisma.$extends({
    name: "user-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!OWNED_MODELS.has(model)) return query(args);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const a = args as any;

          if (FILTERED_OPERATIONS.has(operation)) {
            a.where = { ...(a.where ?? {}), userId };
            if (a.data && typeof a.data === "object") {
              delete a.data.userId;
              delete a.data.user;
            }
            return query(a);
          }

          switch (operation) {
            case "create":
              a.data = { ...a.data, userId };
              delete a.data.user;
              return query(a);

            case "createMany":
            case "createManyAndReturn":
              a.data = (Array.isArray(a.data) ? a.data : [a.data]).map((row: object) => ({ ...row, userId }));
              return query(a);

            case "upsert":
              a.where = { ...(a.where ?? {}), userId };
              a.create = { ...a.create, userId };
              delete a.create.user;
              if (a.update && typeof a.update === "object") {
                delete a.update.userId;
                delete a.update.user;
              }
              return query(a);

            default:
              throw new Error(`Refusing to run "${model}.${operation}" without user scoping.`);
          }
        },
      },
    },
  });
}

export type ScopedDb = ReturnType<typeof scopedDb>;
