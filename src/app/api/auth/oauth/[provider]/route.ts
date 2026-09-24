import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookiesAreSecure } from "@/lib/auth/config";
import { authorizationUrl, OAUTH_COOKIES, OAUTH_FLOW_MINUTES, signFlow } from "@/lib/auth/oauth";
import { isOAuthProviderId, randomToken } from "@/lib/auth/oauth-core";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { signedInDestination } from "@/lib/auth/user";

/** "Continue with Google/Microsoft": remembers state/nonce/PKCE in a signed cookie, then sends the browser to the provider. */
export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isOAuthProviderId(provider)) redirect("/signin");

  const destination = await signedInDestination();
  if (destination) redirect(destination);

  if (await isRateLimited("oauth-start", 30, 10 * 60 * 1000)) redirect("/signin?oauth=busy");

  const flow = { provider, state: randomToken(), nonce: randomToken(), verifier: randomToken() };
  const url = authorizationUrl(flow);
  if (!url) redirect("/signin?oauth=unavailable");

  (await cookies()).set(OAUTH_COOKIES.flow, signFlow(flow), {
    httpOnly: true,
    // Lax still sends it on the provider's top-level GET redirect back to our callback.
    sameSite: "lax",
    secure: cookiesAreSecure(),
    path: "/api/auth/oauth",
    maxAge: OAUTH_FLOW_MINUTES * 60,
  });
  redirect(url);
}
