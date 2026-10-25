import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin, logAdminAction } from "@/lib/auth/admin";
import { safeEqual } from "@/lib/auth/oauth-core";
import { scopedDb } from "@/lib/auth/scoped-db";
import {
  exchangeGmailCode,
  GMAIL_FLOW_COOKIE,
  gmailProfileEmail,
  readGmailFlow,
  revokeRefreshToken,
  sealRefreshToken,
} from "@/lib/gmail/google";

/**
 * Back from Google's consent screen. Stores the (sealed) refresh token against the admin who
 * started the flow. Errors go back to /admin/gmail?gmail=<reason>.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  const query = new URL(request.url).searchParams;
  const store = await cookies();

  const flow = readGmailFlow(store.get(GMAIL_FLOW_COOKIE)?.value);
  store.delete({ name: GMAIL_FLOW_COOKIE, path: "/api/gmail" });

  if (query.get("error")) redirect("/admin/gmail?gmail=cancelled");

  const state = query.get("state") ?? "";
  const code = query.get("code") ?? "";
  if (!flow || flow.userId !== admin.id || !code || !safeEqual(state, flow.state)) {
    redirect("/admin/gmail?gmail=failed");
  }

  const tokens = await exchangeGmailCode(flow, code);
  if (!tokens) redirect("/admin/gmail?gmail=scope");

  const email = await gmailProfileEmail(tokens.accessToken);
  const db = scopedDb(admin.id);
  const sealed = sealRefreshToken(tokens.refreshToken);

  // Reconnecting replaces the token. Switching to a DIFFERENT mailbox also restarts the
  // 90-day look-back, since that mailbox has never been scanned.
  const previous = await db.gmailConnection.findUnique({ where: { userId: admin.id } });
  await db.gmailConnection.upsert({
    where: { userId: admin.id },
    create: { email, refreshTokenSealed: sealed },
    update: {
      email,
      refreshTokenSealed: sealed,
      ...(previous && previous.email !== email ? { lastSyncedAt: null } : {}),
    },
  });
  // Only for a different mailbox: revoking a token from the SAME Google account revokes the whole
  // grant, including the token we were just given.
  if (previous && previous.email !== email) await revokeRefreshToken(previous.refreshTokenSealed);

  await logAdminAction(admin, "gmail.connect", { id: admin.id, email: admin.email }, email);
  redirect("/admin/gmail?gmail=connected");
}
