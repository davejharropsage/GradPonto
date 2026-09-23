import { AppShell } from "@/components/layout/app-shell";
import { requireRegisteredUser, getImpersonationBanner } from "@/lib/auth/user";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // The whole signed-in app sits behind this check: no session goes to sign-in, and someone who
  // verified their email but hasn't finished registering goes to the registration step. If an
  // admin is impersonating someone, `user` here is the IMPERSONATED user — see requireRegisteredUser().
  const [user, impersonation] = await Promise.all([requireRegisteredUser(), getImpersonationBanner()]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, university: user.university, plan: user.plan, role: user.role }}
      impersonation={impersonation}
    >
      {children}
    </AppShell>
  );
}
