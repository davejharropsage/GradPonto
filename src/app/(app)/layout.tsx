import { AppShell } from "@/components/layout/app-shell";
import { ProCard } from "@/components/layout/pro-card";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell proCard={<ProCard />}>{children}</AppShell>;
}
