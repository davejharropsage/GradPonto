import { userDb } from "@/lib/auth/user";

// Progress is always computed live from Application.createdAt, never stored,
// so it can't drift out of sync with the actual data.
export async function getGoalsWithProgress() {
  const db = await userDb();
  const goals = await db.goal.findMany({ orderBy: { startDate: "desc" } });

  return Promise.all(
    goals.map(async (goal) => {
      const count = await db.application.count({
        where: { createdAt: { gte: goal.startDate, lte: goal.endDate } },
      });
      return { ...goal, progress: count };
    })
  );
}
