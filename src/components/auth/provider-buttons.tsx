const PROVIDERS = [
  { name: "Google", mark: "G" },
  { name: "Microsoft", mark: "M" },
  { name: "Apple", mark: "A" },
  { name: "ChatGPT", mark: "C" },
] as const;

/**
 * "Continue with ..." buttons. Only email sign-in works today, so these are shown but
 * disabled and marked "Soon". Each provider needs its own OAuth app and its official
 * button artwork, so the round badges are neutral placeholders, not the provider logos.
 */
export function ProviderButtons() {
  return (
    <div className="space-y-3">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.name}
          type="button"
          disabled
          aria-disabled="true"
          title={`Sign in with ${provider.name} is coming soon`}
          className="relative flex h-12 w-full cursor-not-allowed items-center justify-center rounded-[10px] border border-[#a2a9b8] bg-white px-12 text-[15px] font-semibold text-[#202128] opacity-70"
        >
          <span
            aria-hidden="true"
            className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#e9eef8] text-xs font-extrabold text-[#476adb]"
          >
            {provider.mark}
          </span>
          Continue with {provider.name}
          <span className="absolute right-3 rounded-full bg-[#e9eef8] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#62646d]">
            Soon
          </span>
        </button>
      ))}
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
