import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy - PlacementPilot",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="2026-09-15">
      <p>
        PlacementPilot is a local-first application: the version you install and run stores your data in a SQLite
        database file on your own device. This policy explains, plainly, what data exists, where it goes, and what
        (little) leaves your machine.
      </p>

      <section>
        <h2 className="text-base font-semibold">Data stored locally</h2>
        <p className="mt-2 text-muted-foreground">
          Your applications, employers, CV and cover letter text, notes, and activity timeline are stored only in the
          local database file on your device. Nothing here is uploaded, synced, or backed up anywhere by the
          application itself.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Data stored in your browser</h2>
        <p className="mt-2 text-muted-foreground">
          The app uses your browser&apos;s local storage (not tracking cookies) to remember your theme preference, your
          cookie-consent choice, and, if you arrived via a marketing link, which campaign brought you here (its
          source, medium, and campaign parameters). None of this is shared with a third party.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">What we don&apos;t use</h2>
        <p className="mt-2 text-muted-foreground">
          No analytics platform, no advertising network, and no third-party tracking scripts are included in this
          application.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">AI features</h2>
        <p className="mt-2 text-muted-foreground">
          If you configure an Anthropic API key and use a feature that calls it (job description analysis, CV
          matching, or document tailoring), the specific text involved (a job description, your CV, or a draft
          document) is sent to Anthropic&apos;s API to generate a response. That request is governed by
          Anthropic&apos;s own privacy policy. No other application data is included in these requests, and the
          feature is entirely optional. If no key is configured, no data ever leaves your machine.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Signing up on the landing page</h2>
        <p className="mt-2 text-muted-foreground">
          The sign-up form on the landing page collects your name, email address, and chosen plan. This is stored in
          your own local database. As of this writing, no payment processor is connected and no card details are
          collected. Choosing &quot;Pro&quot; on that form does not create a real subscription or charge you anything.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Your data, your control</h2>
        <p className="mt-2 text-muted-foreground">
          Because everything lives in a local database file, you can inspect, export, or permanently delete all of
          your data at any time by deleting that file, or by deleting individual records inside the application.
          There is no remote account to close because there is no remote account.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Changes to this policy</h2>
        <p className="mt-2 text-muted-foreground">
          If how this application handles data changes materially (for example, if a real hosted or synced version is
          ever introduced), this page will be updated and the date above will change accordingly.
        </p>
      </section>
    </LegalPageLayout>
  );
}
