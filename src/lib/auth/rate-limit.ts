import "server-only";
import { headers } from "next/headers";

// A coarse per-address limiter that lives in this server process's memory. It slows down
// scripted abuse of the sign-in forms. It is a second line of defence: the strict limits
// (codes per email per hour, wrong guesses per code) are enforced in the database.
// If you run several server instances, move this to a shared store such as Redis.
const hits = new Map<string, number[]>();

async function clientKey(): Promise<string> {
  const h = await headers();
  // Behind a proxy the real address is in x-forwarded-for; without one this is "unknown"
  // and everyone shares a bucket, which is fine for local development.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Returns true if this caller has exceeded `limit` calls to `bucket` within `windowMs`. */
export async function isRateLimited(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${bucket}:${await clientKey()}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return recent.length > limit;
}
