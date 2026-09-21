import "server-only";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { AdzunaError, adzunaConfigured, fetchAdzuna } from "./adzuna";
import { rankListings, type JobListing } from "./listing";

// Adzuna's free key allows 25 requests a minute, 250 a day, 1,000 a week and 2,500 a month, and
// that allowance is shared by EVERY user of the app. So searches are protected three ways:
//   1. results are cached for 15 minutes (same words + place = no new request)
//   2. each person gets a limited number of fresh searches per hour
//   3. a global budget stays safely under Adzuna's minute and day limits
// These counters live in this server process; if you run several instances, move them to a
// shared store (for example Redis), like the sign-in rate limiter.

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const USER_SEARCHES_PER_HOUR = 12;
const MINUTE_BUDGET = 20; // Adzuna: 25
const DAY_BUDGET = 200; // Adzuna: 250

const cache = new Map<string, { at: number; listings: JobListing[] }>();
let minuteHits: number[] = [];
let day = { key: "", count: 0 };

export type SearchOutcome =
  | { ok: true; listings: JobListing[]; fromCache: boolean }
  | { ok: false; reason: "not-configured" | "too-many" | "busy" | "unavailable"; message: string };

function cacheKey(keywords: string[], location: string) {
  return `${keywords.map((k) => k.toLowerCase()).sort().join("|")}::${location.trim().toLowerCase()}`;
}

/** True (and counts the request) if there is room in Adzuna's shared allowance. */
function takeBudget(): boolean {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (day.key !== today) day = { key: today, count: 0 };
  minuteHits = minuteHits.filter((t) => now - t < 60_000);
  if (minuteHits.length >= MINUTE_BUDGET || day.count >= DAY_BUDGET) return false;
  minuteHits.push(now);
  day.count++;
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
  if (!takeBudget()) {
    return { ok: false, reason: "busy", message: "Search is very busy right now. Please try again in a few minutes." };
  }

  try {
    const listings = rankListings(await fetchAdzuna(keywords, location), keywords);
    cache.set(key, { at: Date.now(), listings });
    if (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    return { ok: true, listings, fromCache: false };
  } catch (error) {
    console.error("Job search failed:", error instanceof AdzunaError ? error.message : "unexpected error");
    return { ok: false, reason: "unavailable", message: "We couldn't reach the job search service. Please try again shortly." };
  }
}
