import { Sparkles } from "lucide-react";
import { LinkButton } from "@/components/shared/link-button";

/** Top-right plan control: an Upgrade button on the Free plan, a small "Pro" badge on Pro. */
export function UpgradeButton({ plan }: { plan: "FREE" | "PRO" }) {
  if (plan === "PRO") {
    return (
      <span
        title="You're on GradPonto Pro"
        className="inline-flex h-7 items-center gap-1 rounded-full bg-gradient-to-r from-[#86c159] via-[#43a8b2] to-[#5e84e2] px-2.5 text-xs font-extrabold text-[#202128]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Pro
      </span>
    );
  }

  return (
    <LinkButton href="/account" size="sm" title="Unlimited applications & advanced analytics" className="h-8 gap-1.5 px-3">
      <Sparkles className="h-3.5 w-3.5" />
      <span className="max-sm:sr-only">Upgrade</span>
    </LinkButton>
  );
}
