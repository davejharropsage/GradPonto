import { PageHeader } from "@/components/shared/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SentryTestButtons } from "@/components/admin/sentry-test-buttons";
import { sentryEnabled } from "@/lib/sentry-options";

/**
 * Admin-only (admin/layout.tsx): deliberately throws errors so you can check Sentry receives them.
 * `?throw=server` fails while rendering this page on the server; the button fails in the browser.
 */
export default async function SentryTestPage({ searchParams }: { searchParams: Promise<{ throw?: string }> }) {
  const { throw: which } = await searchParams;
  if (which === "server") {
    throw new Error("Sentry test: server error from /admin/sentry-test");
  }

  return (
    <div>
      <PageHeader title="Admin" description="Check that errors reach Sentry." />
      <AdminTabs />
      <div className="max-w-xl space-y-4 text-sm">
        <p>
          Sentry is <strong>{sentryEnabled() ? "on" : "off"}</strong>
          {sentryEnabled() ? "." : ": set NEXT_PUBLIC_SENTRY_DSN in Vercel and redeploy."}
        </p>
        <p className="text-muted-foreground">
          Each button below causes a deliberate error. Within a minute it should appear in Sentry → Issues as
          &ldquo;Sentry test: …&rdquo;. The server one also shows GradPonto&apos;s error page; use your browser&apos;s back button.
        </p>
        <SentryTestButtons />
      </div>
    </div>
  );
}
