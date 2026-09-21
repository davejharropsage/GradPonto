import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MapPin, SearchX, Telescope } from "lucide-react";
import { AddToPipelineButton } from "@/components/find/add-to-pipeline-button";
import { AdzunaCredit } from "@/components/find/adzuna-credit";
import { FindForm } from "@/components/find/find-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireRegisteredUser } from "@/lib/auth/user";
import { getExistingApplicationIds } from "@/lib/data/find";
import { formatRelativeTime } from "@/lib/format";
import { parseKeywords } from "@/lib/jobs/listing";
import { searchPlacements } from "@/lib/jobs/search";

export const metadata: Metadata = { title: "Find placements" };

const EXAMPLES = ["data analytics", "engineering placement", "marketing internship", "degree apprenticeship"];

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; where?: string; show?: string }>;
}) {
  const user = await requireRegisteredUser();
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 200);
  const where = (params.where ?? "").trim().slice(0, 60);
  const showCourses = params.show === "courses";
  const keywords = parseKeywords(q);

  const outcome = keywords.length > 0 ? await searchPlacements(user.id, keywords, where) : null;

  const all = outcome?.ok ? outcome.listings : [];
  const hiddenCount = showCourses ? 0 : all.filter((listing) => listing.paidCourse).length;
  const listings = showCourses ? all : all.filter((listing) => !listing.paidCourse);
  const existing = await getExistingApplicationIds(listings.map((listing) => listing.url));

  const searchHref = (extra?: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (where) next.set("where", where);
    for (const [key, value] of Object.entries(extra ?? {})) next.set(key, value);
    return `/find?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Find placements"
        description="Search live UK placements, internships and apprenticeships, then add the ones you like to your pipeline."
      />

      <FindForm initialQuery={q} initialWhere={where} />

      {!outcome && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <Telescope className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <h2 className="text-lg">Search by the subjects and skills you care about</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Separate keywords with commas. Results are ranked by how well they match, best first, and roles aimed at students come first.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <Link
                key={example}
                href={`/find?q=${encodeURIComponent(example)}`}
                className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                {example}
              </Link>
            ))}
          </div>
        </div>
      )}

      {outcome && !outcome.ok && (
        <div role="alert" className="rounded-2xl border bg-card p-5">
          <p className="font-semibold">{outcome.message}</p>
          {outcome.reason === "not-configured" && process.env.NODE_ENV !== "production" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Developer note: add <code>ADZUNA_APP_ID</code> and <code>ADZUNA_APP_KEY</code> to <code>.env</code> (see <code>.env.example</code>), then reload.
            </p>
          )}
        </div>
      )}

      {outcome?.ok && listings.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="No matches found"
          description="Try broader or different keywords, or clear the location. Adding words like placement, internship or apprentice can help."
        />
      )}

      {outcome?.ok && listings.length > 0 && (
        <section aria-label="Search results" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl">
              {listings.length} match{listings.length === 1 ? "" : "es"}
              <span className="font-sans text-sm font-normal text-muted-foreground"> for &ldquo;{keywords.join(", ")}&rdquo;{where ? ` in ${where}` : ""}</span>
            </h2>
            <AdzunaCredit className="text-xs text-muted-foreground" />
          </div>

          <ul className="space-y-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <article className="rounded-2xl border bg-card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-heading text-xl font-bold leading-tight [font-stretch:84%] hover:underline"
                        >
                          {listing.title}
                        </a>
                        {listing.studentFriendly && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gp-sage-tint)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--gp-sage)]">
                            <GraduationCap className="h-3 w-3" />
                            Student-friendly
                          </span>
                        )}
                        {listing.paidCourse && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800">
                            Charges fees
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{listing.employer}</span>
                        {listing.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.location}
                          </span>
                        )}
                        {listing.postedDate && <span>Posted {formatRelativeTime(listing.postedDate)}</span>}
                        {listing.salary && <span>{listing.salary}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <AddToPipelineButton
                        existingId={existing[listing.url] ?? null}
                        listing={{
                          title: listing.title,
                          employer: listing.employer,
                          location: listing.location,
                          url: listing.url,
                          snippet: listing.snippet,
                          salary: listing.salary,
                          postedDate: listing.postedDate,
                        }}
                      />
                    </div>
                  </div>

                  {listing.snippet && <p className="mt-2 line-clamp-3 text-sm">{listing.snippet}</p>}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {listing.matchedKeywords.map((keyword) => (
                        <span key={keyword} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <AdzunaCredit className="text-[11px] text-muted-foreground" />
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              {hiddenCount} listing{hiddenCount === 1 ? " that appears" : "s that appear"} to be a training course that charges you fees{hiddenCount === 1 ? " is" : " are"} hidden.{" "}
              <Link href={searchHref({ show: "courses" })} className="font-semibold text-foreground underline">
                Show {hiddenCount === 1 ? "it" : "them"}
              </Link>
            </p>
          )}
          {showCourses && all.some((listing) => listing.paidCourse) && (
            <p className="text-sm text-muted-foreground">
              Showing fee-charging courses too.{" "}
              <Link href={searchHref()} className="font-semibold text-foreground underline">
                Hide them
              </Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
