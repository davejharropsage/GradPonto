import { existsSync } from "node:fs";
import path from "node:path";

const ADZUNA = "https://www.adzuna.co.uk";
const LOGO_FILES = ["adzuna-logo.svg", "adzuna-logo.png"];

/**
 * The "Jobs by Adzuna" credit that Adzuna's API terms require next to every advert they supply.
 * Their terms want the word "Adzuna" shown as their official logo image, hyperlinked. That artwork
 * comes from Adzuna (https://www.adzuna.co.uk/press.html) and can't be invented here, so:
 *   - if you save it as public/adzuna-logo.svg (or .png) it is used automatically;
 *   - until then a plain text credit with the same two links is shown.
 */
export function AdzunaCredit({ className }: { className?: string }) {
  const logo = LOGO_FILES.find((file) => existsSync(path.join(process.cwd(), "public", file)));

  return (
    <span className={className}>
      <a href={ADZUNA} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        Jobs
      </a>{" "}
      by{" "}
      <a href={ADZUNA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center align-middle font-semibold underline-offset-2 hover:underline">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- a tiny fixed logo; next/image adds nothing here
          <img src={`/${logo}`} alt="Adzuna" width={58} height={23} className="h-[23px] w-auto" />
        ) : (
          "Adzuna"
        )}
      </a>
    </span>
  );
}
