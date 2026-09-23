import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Nests inside the (app) layout's requireRegisteredUser() check, so everything under /admin
  // gets both "signed in and registered" and "is really an admin" for free.
  await requireAdmin();

  return <>{children}</>;
}
