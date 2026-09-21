import { cn } from "@/lib/utils";

/**
 * The GradPonto mark: an ink rounded square holding a teal "P". Original artwork built from a
 * plain shape, so no image file is needed. (A placeholder until a designed logo exists.)
 */
export function BrandMark({ size = 36, tone = "dark", className }: { size?: number; tone?: "dark" | "light"; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill={tone === "dark" ? "#202128" : "#2b2d36"} />
      <path
        d="M9 22.5V9.5h7.2a3.8 3.8 0 0 1 0 7.6H13"
        fill="none"
        stroke="#79c5cd"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark plus the GradPonto wordmark (tall, condensed, heavy: the headline face). */
export function Brand({
  tone = "dark",
  size = 36,
  subtitle,
  className,
}: {
  tone?: "dark" | "light";
  size?: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} tone={tone} />
      <span className="leading-tight">
        <span
          className={cn(
            "block font-heading text-[1.6rem] font-black leading-none [font-stretch:80%]",
            tone === "light" && "text-white"
          )}
        >
          GradPonto
        </span>
        {subtitle && (
          <span className={cn("mt-0.5 block text-xs", tone === "light" ? "text-white/60" : "text-muted-foreground")}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
