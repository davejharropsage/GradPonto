import type { Metadata } from "next";
import "./landing.css";
import { FeatureTabs } from "@/components/landing/feature-tabs";
import { LandingCta, LandingFooter, LandingHeader, SvgDefs } from "@/components/landing/landing-chrome";
import {
  Bento,
  Faq,
  FeaturesHeading,
  featurePanels,
  Hero,
  HowItWorks,
  WhyGradPonto,
} from "@/components/landing/landing-sections";
import { signedInDestination } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: { absolute: "GradPonto: find, apply and track UK placements" },
  description:
    "GradPonto helps UK graduates find placements, internships and apprenticeships, apply on the employer's site, and track every application in one place.",
};

export default async function LandingPage() {
  const signedIn = (await signedInDestination()) !== null;

  return (
    <div className="gp-landing">
      <SvgDefs />
      <LandingHeader signedIn={signedIn} />
      <main id="main-content">
        <Hero />
        <section className="section" id="features">
          <div className="wrap">
            <FeaturesHeading />
            <FeatureTabs panels={featurePanels()} />
          </div>
        </section>
        <Bento />
        <HowItWorks />
        <WhyGradPonto />
        <Faq />
        <LandingCta signedIn={signedIn} />
      </main>
      <LandingFooter />
    </div>
  );
}
