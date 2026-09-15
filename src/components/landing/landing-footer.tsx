import Link from "next/link";
import { Rocket } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Rocket className="h-4 w-4" />
          PlacementPilot
        </div>
        <p>Runs locally on your own device. Your applications, CVs, and cover letters never leave your machine.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
