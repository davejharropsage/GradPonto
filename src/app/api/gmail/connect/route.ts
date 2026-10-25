import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { cookiesAreSecure } from "@/lib/auth/config";
import { randomToken } from "@/lib/auth/oauth-core";
import { GMAIL_FLOW_COOKIE, GMAIL_FLOW_MINUTES, gmailAuthorizationUrl, signGmailFlow } from "@/lib/gmail/google";

/** "Connect Gmail" (admin-only): remembers state/PKCE in a signed cookie, then sends the browser to Google. */
export async function GET() {
  const admin = await requireAdmin();

  const flow = { userId: admin.id, state: randomToken(), verifier: randomToken() };
  const url = gmailAuthorizationUrl(flow, admin.email);
  if (!url) redirect("/admin/gmail?gmail=unavailable");

  (await cookies()).set(GMAIL_FLOW_COOKIE, signGmailFlow(flow), {
    httpOnly: true,
    // Lax still sends it on Google's top-level GET redirect back to our callback.
    sameSite: "lax",
    secure: cookiesAreSecure(),
    path: "/api/gmail",
    maxAge: GMAIL_FLOW_MINUTES * 60,
  });
  redirect(url);
}
