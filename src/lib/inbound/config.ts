import "server-only";

/**
 * Email import settings. Both must be set for the feature to switch on:
 * - INBOUND_EMAIL_DOMAIN: the (sub)domain whose MX points at the inbound provider, e.g. in.gradponto.com
 * - INBOUND_WEBHOOK_SECRET: the password the provider sends with each webhook (HTTP basic auth)
 */
export function inboundDomain(): string | null {
  return process.env.INBOUND_EMAIL_DOMAIN?.trim().toLowerCase() || null;
}

export function inboundWebhookSecret(): string | null {
  const secret = process.env.INBOUND_WEBHOOK_SECRET?.trim();
  return secret && secret.length >= 24 ? secret : null;
}

export function inboundConfigured(): boolean {
  return Boolean(inboundDomain() && inboundWebhookSecret());
}

export function inboundAddress(token: string): string | null {
  const domain = inboundDomain();
  return domain ? `${token}@${domain}` : null;
}
