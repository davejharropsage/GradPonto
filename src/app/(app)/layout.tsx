import { AppShell } from "@/components/layout/app-shell";
import { ProCard } from "@/components/layout/pro-card";
import { requireRegisteredUser } from "@/lib/auth/user";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // The whole signed-in app sits behind this check: no session goes to sign-in, and someone who
  // verified their email but hasn't finished registering goes to the registration step.
  const user = await requireRegisteredUser();

  return (
    <AppShell proCard={<ProCard />} user={{ name: user.name, email: user.email, university: user.university }}>
      {children}
    </AppShell>
  );
}
