import { userDb } from "@/lib/auth/user";

/** Which of these job links are already in the signed-in user's pipeline? Returns { url: applicationId }. */
export async function getExistingApplicationIds(urls: string[]): Promise<Record<string, string>> {
  if (urls.length === 0) return {};
  const db = await userDb();
  const rows = await db.application.findMany({
    where: { jobUrl: { in: urls } },
    select: { id: true, jobUrl: true },
  });
  return Object.fromEntries(rows.flatMap((row) => (row.jobUrl ? [[row.jobUrl, row.id]] : [])));
}
