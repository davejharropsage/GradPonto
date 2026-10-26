import "server-only";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { takeDailyAllowance } from "@/lib/limits";
import { logError } from "@/lib/monitoring";
import { AdzunaError, adzunaConfigured, fetchAdzuna } from "./adzuna";
import { rankListings, type JobListing } from "./listing";

// Adzuna's free key allows 25 requests a minute, 250 a day, 1,000 a week and 2,500 a month, and
// that allowance is shared by EVERY user of the app. So searches are protected three ways:
//   1. results are cached for 15 minutes (same words + place = no new request)
//   2. each person gets a limited number of fresh searches per hour
//   3. a global budget stays safely under Adzuna's minute and day limits
// The per-hour and per-minute counters live in this server process (a cheap first check); the
// daily budget is counted in the database (lib/limits.ts), so it holds across every instance.

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const USER_SEARCHES_PER_HOUR = 12;
const MINUTE_BUDGET = 20; // Adzuna: 25 (the daily budget is ADZUNA_DAILY_LIMIT, see lib/limits.ts)

const cache = new Map<string, { at: number; listings: JobListing[] }>();
let minuteHits: number[] = [];

export type SearchOutcome =
  | { ok: true; listings: JobListing[]; fromCache: boolean }
  | { ok: false; reason: "not-configured" | "too-many" | "busy" | "unavailable"; message: string };

function cacheKey(keywords: string[], location: string) {
  return `${keywords.map((k) => k.toLowerCase()).sort().join("|")}::${location.trim().toLowerCase()}`;
}

/** True (and counts the request) if there is room in Adzuna's per-minute allowance. */
function takeMinuteBudget(): boolean {
  const now = Date.now();
  minuteHits = minuteHits.filter((t) => now - t < 60_000);
  if (minuteHits.length >= MINUTE_BUDGET) return false;
  minuteHits.push(now);
  return true;
}

export async function searchPlacements(userId: string, keywords: string[], location: string): Promise<SearchOutcome> {
  if (!adzunaConfigured()) {
    return { ok: false, reason: "not-configured", message: "Job search isn't set up yet." };
  }

  const key = cacheKey(keywords, location);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return { ok: true, listings: cached.listings, fromCache: true };

  if (isRateLimitedKey(`find:${userId}`, USER_SEARCHES_PER_HOUR, 60 * 60 * 1000)) {
    return { ok: false, reason: "too-many", message: "You've run a lot of searches this hour. Please try again a little later." };
  }
  if (!takeMinuteBudget()) {
    return { ok: false, reason: "busy", message: "Search is very busy right now. Please try again in a few minutes." };
  }
  // Durable, and also what the admin usage dashboard counts. Taken before the call: an attempt
  // that fails still counts towards Adzuna's allowance.
  if (!(await takeDailyAllowance("ADZUNA", { total: "ADZUNA" }, userId)).ok) {
    return { ok: false, reason: "busy", message: "Job search has reached its limit for today. Please try again tomorrow." };
  }

  try {
    const listings = rankListings(await fetchAdzuna(keywords, location), keywords);
    cache.set(key, { at: Date.now(), listings });
    if (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    return { ok: true, listings, fromCache: false };
  } catch (error) {
    // An AdzunaError's message is ours; anything else is logged by name only, since some runtimes
    // echo the request URL (with the API key in it) into network error messages.
    logError("Job search", error instanceof AdzunaError ? error : new Error(error instanceof Error ? error.name : "unexpected error"));
    return { ok: false, reason: "unavailable", message: "We couldn't reach the job search service. Please try again shortly." };
  }
}
