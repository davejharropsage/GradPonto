import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { CvSpotlight } from "@/components/landing/cv-spotlight";
import { PricingSignup } from "@/components/landing/pricing-signup";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "PlacementPilot — Track your placement search",
  description: "Track applications, tailor your CV with AI, and never miss a deadline.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureGrid />
        <CvSpotlight />
        <PricingSignup />
      </main>
      <LandingFooter />
    </div>
  );
}
