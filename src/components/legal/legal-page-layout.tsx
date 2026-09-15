import Link from "next/link";
import { Rocket, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/landing" className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Rocket className="h-4 w-4" />
            </div>
            PlacementPilot
          </Link>
          <Link href="/landing" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {formatDate(lastUpdated)}</p>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-foreground">{children}</div>
      </main>
    </div>
  );
}
