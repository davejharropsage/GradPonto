"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createSignup } from "@/lib/actions/signup";
import { UTM_STORAGE_KEY } from "./utm-capture";

const plans = [
  {
    id: "FREE" as const,
    name: "Free",
    price: "£0",
    cadence: "forever",
    description: "Everything you need to run a focused placement search.",
    features: [
      "Up to 10 active applications",
      "Kanban pipeline & deadlines",
      "Base CV & cover letter storage",
      "Manual application tracking",
    ],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "£4.99",
    cadence: "/month",
    description: "For a full-scale search across many applications at once.",
    features: [
      "Unlimited applications",
      "AI job analysis & CV matching",
      "AI-tailored CVs & cover letters",
      "Advanced analytics (coming soon)",
    ],
    highlighted: true,
  },
];

export function PricingSignup() {
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO">("FREE");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [utm, setUtm] = useState<{ utm_source?: string; utm_medium?: string; utm_campaign?: string }>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(UTM_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is only possible client-side, after mount
      if (stored) setUtm(JSON.parse(stored));
    } catch {
      // Ignore — attribution is best-effort only.
    }
  }, []);

  return (
    <section id="pricing" className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-accent-foreground">Pricing</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Simple pricing</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade only if you need to track more at once.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "rounded-2xl border bg-card p-6 text-left transition-colors",
              plan.highlighted && "border-primary",
              selectedPlan === plan.id ? "ring-2 ring-primary" : "hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{plan.name}</h3>
              {plan.highlighted && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  Popular
                </span>
              )}
            </div>
            <p className="mt-2 text-3xl font-extrabold">
              {plan.price}
              <span className="text-base font-normal text-muted-foreground"> {plan.cadence}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div id="signup" className="mx-auto mt-16 max-w-md scroll-mt-24 rounded-2xl border border-border bg-card p-8 shadow-[0_20px_40px_-24px_rgba(10,31,20,0.2)]">
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Rocket className="h-6 w-6" />
            </div>
            <h3 className="font-bold">You&apos;re signed up</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedPlan === "PRO" ? "Your account is set to Pro." : "Your account is set to Free."} Head into the
              app to get started.
            </p>
            <LinkButton href="/" className="mt-4">
              Open PlacementPilot
            </LinkButton>
          </div>
        ) : (
          <>
            <h3 className="font-bold">Get started: {selectedPlan === "PRO" ? "Pro" : "Free"} plan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This app runs locally, so signing up just sets up your local profile. No payment is processed.
            </p>
            <form
              className="mt-4 grid gap-3"
              action={(formData) => {
                setError(null);
                startTransition(async () => {
                  try {
                    await createSignup(formData);
                    setSubmitted(true);
                  } catch {
                    setError("Something went wrong. Check your details and try again.");
                  }
                });
              }}
            >
              <input type="hidden" name="plan" value={selectedPlan} />
              <input type="hidden" name="utmSource" value={utm.utm_source ?? ""} />
              <input type="hidden" name="utmMedium" value={utm.utm_medium ?? ""} />
              <input type="hidden" name="utmCampaign" value={utm.utm_campaign ?? ""} />
              <div className="grid gap-1.5">
                <Label htmlFor="signup-name">Name</Label>
                <Input id="signup-name" name="name" required placeholder="Jordan Smith" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={pending} className="mt-1">
                {pending ? "Signing up..." : selectedPlan === "PRO" ? "Start Pro" : "Start free"}
              </Button>
            </form>
          </>
        )}
      </div>
      </div>
    </section>
  );
}
