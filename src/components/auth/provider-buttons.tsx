import type { ReactNode } from "react";
import { oauthEnabled } from "@/lib/auth/oauth";
import type { OAuthProviderId } from "@/lib/auth/oauth-core";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" className="h-5 w-5" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  );
}

const PROVIDERS: { id: OAuthProviderId | "apple"; name: string; mark: ReactNode }[] = [
  { id: "google", name: "Google", mark: <GoogleMark /> },
  { id: "microsoft", name: "Microsoft", mark: <MicrosoftMark /> },
  // Needs a paid Apple Developer membership, so it stays "Soon" for now.
  { id: "apple", name: "Apple", mark: <AppleMark /> },
];

const BUTTON = "relative flex h-12 w-full items-center justify-center rounded-[10px] border border-[#a2a9b8] bg-white px-12 text-[15px] font-semibold text-[#202128]";

/**
 * "Continue with ..." buttons, shared by sign-in and sign-up (the flow is the same: a provider
 * account seen before signs in, a new one confirms its email with a code first). A provider's
 * button only works once its keys are in the environment (see .env.example); until then it's
 * shown disabled and marked "Soon".
 */
export function ProviderButtons() {
  return (
    <div className="space-y-3">
      {PROVIDERS.map((provider) => {
        const enabled = provider.id !== "apple" && oauthEnabled(provider.id);
        const mark = <span className="absolute left-4 flex items-center">{provider.mark}</span>;

        if (enabled) {
          // A plain <a>, not <Link>: this is a route handler that redirects off-site, so it
          // must be a full navigation and must never be prefetched.
          return (
            <a key={provider.id} href={`/api/auth/oauth/${provider.id}`} className={`${BUTTON} transition-colors hover:bg-[#f5f7fb]`}>
              {mark}
              Continue with {provider.name}
            </a>
          );
        }

        return (
          <button
            key={provider.id}
            type="button"
            disabled
            aria-disabled="true"
            title={`Sign in with ${provider.name} is coming soon`}
            className={`${BUTTON} cursor-not-allowed opacity-70`}
          >
            {mark}
            Continue with {provider.name}
            <span className="absolute right-3 rounded-full bg-[#e9eef8] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#62646d]">
              Soon
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-bold tracking-wider text-[#62646d]" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-[#e1e6ef]" />
      OR
      <span className="h-px flex-1 bg-[#e1e6ef]" />
    </div>
  );
}
