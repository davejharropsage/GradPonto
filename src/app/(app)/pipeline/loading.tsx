import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 flex gap-4 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-72 shrink-0" />
        ))}
      </div>
    </div>
  );
}
