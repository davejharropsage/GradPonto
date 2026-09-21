import { requireRegisteredUser } from "@/lib/auth/user";

/** The signed-in user's details (name, university, plan). Redirects to sign-in if nobody is signed in. */
export async function getProfile() {
  const user = await requireRegisteredUser();
  return { id: user.id, email: user.email, name: user.name, university: user.university, plan: user.plan };
}

export function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
