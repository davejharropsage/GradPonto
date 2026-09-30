import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

// Written to describe what the software actually does today, so nothing on this page is false.
// Reflects UK GDPR / Data Protection Act 2018 requirements (controller identity, lawful basis,
// processors, international transfers, retention, and data-subject rights). Update this page
// whenever data handling changes, and keep it in step with what the code actually does.
export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="2026-09-30">
      <p>
        GradPonto helps UK graduates find, apply for and keep track of placements, internships and apprenticeships. This
        policy explains what personal data the service holds about you, why, where it goes, and what rights you have
        over it. It is written for UK users and follows the UK General Data Protection Regulation (UK GDPR) and the Data
        Protection Act 2018.
      </p>

      <section>
        <h2 className="text-base font-semibold">Who is responsible for your data</h2>
        <p className="mt-2 text-muted-foreground">
          GradPonto is operated by Lucas Harrop (the &ldquo;data controller&rdquo; under UK GDPR). For any question about
          this policy, or to exercise any of the rights below, contact{" "}
          <a href="mailto:privacy@gradponto.com" className="underline">
            privacy@gradponto.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">What we collect, and why</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account details</strong> &mdash; your email address, name and
            university, and a securely hashed version of your password (we never store or can see the password
            itself). Used to create and secure your account.
          </li>
          <li>
            <strong className="text-foreground">Content you add</strong> &mdash; applications, employers, CVs and cover
            letters, notes, activity history and goals. Used to provide the tracking and document features you use.
          </li>
          <li>
            <strong className="text-foreground">Sign-in and security records</strong> &mdash; when you last signed in,
            and for each active session its start/expiry time and browser description (user agent). Short-lived
            verification codes (for email confirmation and password reset) are stored only as a hashed value and expire
            within minutes. Used to keep your account secure and let you manage your own sessions.
          </li>
          <li>
            <strong className="text-foreground">Admin/support records</strong> &mdash; if an administrator suspends,
            reinstates, or briefly views your account to help with a support issue, that action is logged with who did
            it, to whom, and when. Used for accountability and to detect misuse.
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Our lawful basis for this processing is <strong className="text-foreground">performance of a contract</strong>{" "}
          with you (providing the service you signed up for) and, for security and audit logging,{" "}
          <strong className="text-foreground">our legitimate interest</strong> in keeping the service secure and
          reliable. We do not use your data for marketing and do not require your consent for any of the processing
          described here.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Signing in, and emails we send</h2>
        <p className="mt-2 text-muted-foreground">
          Sign-in uses your email address and password. We email a one-time verification code to confirm a new address
          and to let you reset a forgotten password; each code expires after a short time and works once. When you
          finish creating your account we send one welcome email. These are the only emails the service sends &mdash;
          there is no marketing email. We use MailerSend, a UK/EU-facing email delivery provider, to send them; they
          process the message content only to deliver it.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Cookies and browser storage</h2>
        <p className="mt-2 text-muted-foreground">
          We use only what is needed to run the service: a sign-in (session) cookie so you stay signed in, a
          short-lived cookie that remembers which email address is completing sign-up or a password reset, an
          administrator-only cookie used solely while an admin is temporarily viewing the app as a user for support,
          and your browser&apos;s local storage to remember your theme preference. All of these are strictly necessary
          for the service to function, so no cookie consent banner is shown. We do not use analytics, advertising or
          third-party tracking cookies.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">AI features</h2>
        <p className="mt-2 text-muted-foreground">
          Where an AI feature is switched on and you choose to use it (job description analysis, CV matching, ATS
          keyword checking, or document generation/tailoring), the specific text involved (a job description, your CV,
          or a draft document) is sent to Google&apos;s Gemini API to produce a response, with Anthropic&apos;s Claude
          API used only as a fallback if Gemini is unavailable. No other account data is included in that request, and
          nothing is sent if you don&apos;t use these features. These providers are based outside the UK; sending data
          to them is an international transfer, and we rely on their standard contractual safeguards for this. Each
          provider processes the text under its own privacy policy and does not use it to identify you.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Job search</h2>
        <p className="mt-2 text-muted-foreground">
          The Find placements search sends your search terms (keywords, location) to the Adzuna API, a UK job-search
          provider, to return matching listings. No account data beyond the search terms you enter is sent.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Who can see your data, and where it is hosted</h2>
        <p className="mt-2 text-muted-foreground">
          Your applications and documents are private to your account; other users cannot see them, and we do not sell
          your data. We use third-party providers to run the service on our behalf, acting as our data processors: the
          application runs on Vercel, and data is stored in a Neon-hosted PostgreSQL database. These providers may store
          or process data outside the UK; where they do, we rely on their standard contractual safeguards for that
          transfer.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">How long we keep your data</h2>
        <p className="mt-2 text-muted-foreground">
          We keep your account and its data for as long as your account is active. If you ask us to delete your
          account (see below), we delete your account and the data linked to it, except where we must keep a minimal
          record (e.g. of an admin action) for security or legal reasons, which we keep no longer than necessary.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Your rights</h2>
        <p className="mt-2 text-muted-foreground">
          Under UK GDPR you have the right to access, correct, delete, restrict, or receive a portable copy of your
          personal data, and to object to certain processing. In practice:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>You can correct your name and university yourself on the Account page at any time.</li>
          <li>You can download a complete copy of your data from the Account page at any time.</li>
          <li>
            You can delete your account and everything in it yourself, immediately and permanently, from the Account
            page &mdash; no need to contact us. If you&apos;d rather keep the option to come back, the Account page
            also lets you pause your account for 30 days instead: you&apos;re signed out everywhere straight away,
            and signing back in with your password at any point during those 30 days undoes it and picks up exactly
            where you left off.
          </li>
          <li>
            For any other request, or a question about how your data is handled, use the same address. We will respond
            within one month, as UK GDPR requires.
          </li>
          <li>
            If you&apos;re unhappy with how we&apos;ve handled your data, you can complain to the UK&apos;s data
            protection regulator, the{" "}
            <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer" className="underline">
              Information Commissioner&apos;s Office (ICO)
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold">Automated decisions</h2>
        <p className="mt-2 text-muted-foreground">
          AI features (match scores, suggestions, generated drafts) are there to help you decide &mdash; they never
          make a decision about you automatically, and nothing about your account or access is decided by an
          algorithm.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">Children</h2>
        <p className="mt-2 text-muted-foreground">GradPonto is intended for adult graduates and is not directed at children.</p>
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
