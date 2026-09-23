import "server-only";
import { requireRegisteredUser } from "@/lib/auth/user";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/db";

// The free Gemini key has a small daily allowance shared by everyone using the app, so each person
// gets a fair share per hour. Call this before any AI request; it also confirms they are signed in.
const AI_CALLS_PER_HOUR = 30;

export async function requireAiAllowance() {
  const user = await requireRegisteredUser();
  if (isRateLimitedKey(`ai:${user.id}`, AI_CALLS_PER_HOUR, 60 * 60 * 1000)) {
    throw new Error("You've used a lot of AI requests in the last hour. Please try again a bit later.");
  }
  // Durable, for the admin usage dashboard — the rate-limit check above is in-memory and resets
  // on every restart, so it can't answer "how much has the app used today".
  await prisma.usageEvent.create({ data: { kind: "AI", userId: user.id } });
  return user;
}
