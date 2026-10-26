import { safeEqual } from "@/lib/auth/oauth-core";
import { usersWithWaitingEmails } from "@/lib/auth/inbound";
import { processInboundQueue } from "@/lib/inbound/process";
import { logError } from "@/lib/monitoring";

export const maxDuration = 60;
// One user's processInboundQueue() can take up to ~40s of AI calls, so another user is only
// started early in the run; anyone left over is picked up 15 minutes later.
const START_NEXT_USER_BEFORE_MS = 10_000;
const USERS_PER_RUN = 20;

/**
 * Scheduled retry for Email import (vercel.json → crons): classifies forwarded emails that are
 * still waiting because the AI was busy or out of allowance when they arrived, so nobody has to
 * press "Process" on the Email import page. Vercel calls it with `Authorization: Bearer
 * <CRON_SECRET>`; anything else gets a 401.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return Response.json({ error: "CRON_SECRET isn't set" }, { status: 503 });
  if (!safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const users = await usersWithWaitingEmails(USERS_PER_RUN);
  let classified = 0;
  let created = 0;
  let processedUsers = 0;
  for (const userId of users) {
    if (processedUsers > 0 && Date.now() - started > START_NEXT_USER_BEFORE_MS) break;
    try {
      const result = await processInboundQueue(userId);
      classified += result.classified;
      created += result.created;
      processedUsers++;
      // The AI is down or rate-limited for everyone: no point trying the next user this run.
      if (result.error && result.classified === 0) {
        logError("Scheduled inbound retry stopped", new Error(result.error), { userId });
        break;
      }
    } catch (error) {
      logError("Scheduled inbound retry", error, { userId });
    }
  }
  return Response.json({ ok: true, usersWaiting: users.length, processedUsers, classified, created });
}
