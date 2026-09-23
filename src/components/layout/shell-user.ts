/** What the app shell needs to know about the signed-in person. */
export interface ShellUser {
  name: string | null;
  email: string;
  university: string | null;
  plan: "FREE" | "PRO";
  role: "USER" | "ADMIN";
}

export function initials(user: Pick<ShellUser, "name" | "email">) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}
