import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

// DRAFT: written to describe what the software actually does today, so nothing on this page is
// false. It has NOT been reviewed by a lawyer or data-protection lead. Before public launch it
// needs the items in [square brackets] filled in (who is responsible, contact details, retention,
// hosting location and lawful basis) and a review for UK GDPR.
export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="2026-09-21">
      <p className="rounded-lg bg-muted p-3 text-muted-foreground">
        <strong className="text-foreground">Draft.</strong> This policy describes how GradPonto handles data today. It is
        still being reviewed and will be finalised before launch.
      </p>

      <p>
        GradPonto helps UK graduates find, apply for and keep track of placements, internships and apprenticeships. This
        page explains what data the service holds about you, where it goes, and what you can do about it.
      </p>

      <section>
        <h2 className="text-base font-semibold">Who is responsible</h2>
        <p className="mt-2 text-muted-foreground">
          [Name of the company or person operating GradPonto, and a contact email for privacy questions. To be completed
          before launch.]
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">What we store</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Your email address, name and university, which you give us when you create your account.</li>
          <li>
            What you put into the app: applications, employers, CV and cover letter text, notes, activity history and
            goals.
          </li>
          <li>
            Sign-in records: when you last signed in, and for each signed-in browser its start and expiry time and its
            browser description (user agent).
          </li>
          <li>
            Short-lived sign-in codes. Only a scrambled (hashed) version of each code is kept, and it is deleted or
            expires within minutes.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold">Signing in, and emails we send</h2>
        <p className="mt-2 text-muted-foreground">
          There are no passwords. To sign in we email a one-time 6-digit code to your address; it expires after 10
          minutes and works once. When you finish creating your account we send one confirmation email. These are the only
          emails the service sends. We use [email delivery provider, to be completed] to send them.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Cookies and browser storage</h2>
        <p className="mt-2 text-muted-foreground">
          We use only what is needed to run the service: a sign-in (session) cookie so you stay signed in, a short-lived
          cookie that remembers which email a code was sent to during sign-in, and your browser&apos;s local storage to
          remember your theme preference. These are strictly necessary, so there is no cookie banner. We do not use
          analytics, advertising or third-party tracking.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">AI features</h2>
        <p className="mt-2 text-muted-foreground">
          Where AI features are switched on, using one (job description analysis, CV matching or document tailoring)
          sends the specific text involved (a job description, your CV or a draft document) to Anthropic&apos;s API to
          produce a response. That request is governed by Anthropic&apos;s own privacy policy. No other data from your
          account is included. If the feature is off, nothing is sent.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Who can see your data</h2>
        <p className="mt-2 text-muted-foreground">
          Your applications and documents are private to your account. Other users cannot see them. We do not sell your
          data. Our hosting and email providers process it on our behalf so the service works. [Hosting provider and
          location, to be completed.]
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Your choices</h2>
        <p className="mt-2 text-muted-foreground">
          You can correct your name and university on the Account page, and download a complete copy of your data from
          there at any time. To have your account and everything in it deleted, [contact route, to be completed]. How
          long we keep data after you stop using the service: [retention period, to be completed].
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Changes to this policy</h2>
        <p className="mt-2 text-muted-foreground">
          If how we handle data changes materially, this page will be updated and the date above will change.
        </p>
      </section>
    </LegalPageLayout>
  );
}
