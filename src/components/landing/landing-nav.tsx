import Link from "next/link";
import { Rocket } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/landing" className="flex items-center gap-2 font-extrabold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Rocket className="h-4 w-4" />
          </div>
          PlacementPilot
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-xs uppercase tracking-wide text-muted-foreground sm:flex">
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <LinkButton href="/" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Open app
          </LinkButton>
          <LinkButton href="#signup" size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            Sign up
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
