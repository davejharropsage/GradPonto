import { after } from "next/server";
import { safeEqual } from "@/lib/auth/oauth-core";
import { findInboxOwner } from "@/lib/auth/inbound";
import { isRateLimitedKey } from "@/lib/auth/rate-limit";
import { inboxTokenFromRecipient } from "@/lib/inbound/core";
import { inboundDomain, inboundWebhookSecret } from "@/lib/inbound/config";
import { ingestInboundEmail } from "@/lib/inbound/ingest";
import { fromPostmark, parsePostmarkPayload, postmarkRecipients } from "@/lib/inbound/parse";
import { processInboundQueue } from "@/lib/inbound/process";
import { takeDailyAllowance } from "@/lib/limits";
import { logError, reportError } from "@/lib/monitoring";

// Filing the email is quick; classifying it runs in after() once Postmark has its 200.
export const maxDuration = 60;

// Emails per inbox per hour. Far above real use (a "Forward as attachment" batch counts once) —
// it's here to stop a leaked address being used to run up the AI bill.
const MESSAGES_PER_HOUR = 120;

/**
 * Postmark's inbound webhook: one POST per email received at `<token>@INBOUND_EMAIL_DOMAIN`.
 * Postmark retries anything but a 2xx, so mail we deliberately drop (unknown address, suspended
 * account) still gets a 200. Postmark is configured with basic-auth credentials in the URL:
 * https://postmark:<INBOUND_WEBHOOK_SECRET>@<site>/api/inbound/postmark
 */
export async function POST(request: Request) {
  const secret = inboundWebhookSecret();
  const domain = inboundDomain();
  if (!secret || !domain) return Response.json({ error: "Email import isn't set up" }, { status: 503 });

  const auth = request.headers.get("authorization") ?? "";
  const password = auth.startsWith("Basic ") ? Buffer.from(auth.slice(6), "base64").toString("utf8").split(":").slice(1).join(":") : "";
  if (!safeEqual(password, secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = parsePostmarkPayload(await request.json());
  } catch {
    payload = null;
  }
  if (!payload) return Response.json({ error: "Not a Postmark inbound payload" }, { status: 400 });

  const token = postmarkRecipients(payload)
    .map((recipient) => inboxTokenFromRecipient(recipient, domain))
    .find(Boolean);
  if (!token) return Response.json({ ignored: "no inbox address" });

  const owner = await findInboxOwner(token);
  if (!owner) return Response.json({ ignored: "unknown inbox" });

  if (isRateLimitedKey(`inbound:${owner.user.id}`, MESSAGES_PER_HOUR, 60 * 60 * 1000)) {
    // Postmark backs off and retries later.
    return Response.json({ error: "Too many emails for this inbox; try later" }, { status: 429 });
  }
  // Daily caps (lib/limits.ts). Postmark has already billed for the email by now; this stops a
  // flood running up the AI bill as well. Dropped with a 200: retrying tomorrow wouldn't help.
  const allowance = await takeDailyAllowance("INBOUND", { total: "INBOUND", perUser: "INBOUND_PER_USER" }, owner.user.id);
  if (!allowance.ok) {
    logError("Inbound email dropped", new Error(`daily ${allowance.scope} limit reached`), { userId: owner.user.id });
    return Response.json({ ignored: "daily limit reached" });
  }

  let result;
  try {
    result = await ingestInboundEmail(
      { userId: owner.user.id, userEmail: owner.user.email, knownAddresses: owner.inbox.knownAddresses },
      fromPostmark(payload)
    );
  } catch (error) {
    await reportError("Inbound email webhook", error, { userId: owner.user.id });
    // 500: Postmark retries later, so nothing is lost while it's fixed.
    return Response.json({ error: "Couldn't file this email" }, { status: 500 });
  }

  if (result.kind === "emails" && result.queued > 0) {
    after(async () => {
      try {
        const processed = await processInboundQueue(owner.user.id);
        // Usually the AI being busy or the user's AI allowance — left queued, and the AI client
        // itself alerts on real outages. The Email import page has a "Process" button.
        if (processed.error) logError("Inbound emails left queued", new Error(processed.error), { userId: owner.user.id });
      } catch (error) {
        await reportError("Inbound email processing", error, { userId: owner.user.id });
      }
    });
  }
  return Response.json({ ok: true, ...result });
}
