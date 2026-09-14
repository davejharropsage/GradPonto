import { LinkButton } from "@/components/shared/link-button";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <LinkButton
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={isFirst}
          variant="outline"
          size="sm"
          className={isFirst ? "pointer-events-none opacity-50" : undefined}
        >
          Previous
        </LinkButton>
        <LinkButton
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={isLast}
          variant="outline"
          size="sm"
          className={isLast ? "pointer-events-none opacity-50" : undefined}
        >
          Next
        </LinkButton>
      </div>
    </div>
  );
}
