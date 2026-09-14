import { db } from "@/lib/db";

export async function getProfile() {
  const profile = await db.profile.findUnique({ where: { id: "default" } });
  return profile ?? { id: "default", name: null, plan: "FREE" as const, updatedAt: new Date() };
}

export function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
