import "server-only";
import { requireRegisteredUser } from "@/lib/auth/user";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { takeDailyAllowance } from "@/lib/limits";

// The free Gemini key has a small daily allowance shared by everyone using the app, so each person
// gets a fair share per hour. Call this before any AI request; it also confirms they are signed in.
const AI_CALLS_PER_HOUR = 30;

export async function requireAiAllowance() {
  const user = await requireRegisteredUser();
  await consumeAiAllowance(user.id);
  return user;
}

/**
 * The same allowance, charged to a user the caller has already resolved — for work with no signed-in
 * request behind it, like classifying forwarded emails after the inbound webhook (lib/inbound/process.ts).
 */
export async function consumeAiAllowance(userId: string) {
  if (isRateLimitedKey(`ai:${userId}`, AI_CALLS_PER_HOUR, 60 * 60 * 1000)) {
    throw new Error("You've used a lot of AI requests in the last hour. Please try again a bit later.");
  }
  // The hourly check above is in-memory (per server instance, reset on restart); the daily caps
  // are counted in the database, so they hold everywhere — and are what the admin usage page shows.
  const allowance = await takeDailyAllowance("AI", { total: "AI", perUser: "AI_PER_USER" }, userId);
  if (!allowance.ok) {
    throw new Error(
      allowance.scope === "user"
        ? "You've reached today's limit for AI requests. It resets overnight."
        : "GradPonto's AI features have reached their limit for today. Please try again tomorrow."
    );
  }
}
