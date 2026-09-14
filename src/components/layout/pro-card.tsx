import { Sparkles } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";
import { getProfile } from "@/lib/data/profile";

export async function ProCard() {
  const profile = await getProfile();
  if (profile.plan === "PRO") {
    return (
      <div className="rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4" />
          PlacementPilot Pro
        </div>
        <p className="mt-1 text-sm text-primary-foreground/80">You have unlimited applications and advanced analytics.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-primary p-4 text-primary-foreground">
      <div className="flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4" />
        PlacementPilot Pro
      </div>
      <p className="mt-1 text-sm text-primary-foreground/80">Unlimited applications &amp; advanced analytics.</p>
      <LinkButton href="/account" variant="secondary" size="sm" className="mt-3 w-full justify-center">
        Upgrade now
      </LinkButton>
    </div>
  );
}
