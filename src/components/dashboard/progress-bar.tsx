import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ProgressBar({
  buckets,
}: {
  buckets: { key: string; label: string; count: number; color: string }[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Your Application Progress</CardTitle>
        <Link href="/pipeline" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          Pipeline →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {buckets.map((bucket, i) => (
            <div key={bucket.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white",
                    bucket.count > 0 ? bucket.color : "bg-muted text-muted-foreground"
                  )}
                >
                  {bucket.count}
                </div>
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
              </div>
              {i < buckets.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
