"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveApplication, unarchiveApplication } from "@/lib/actions/applications";
import { cn } from "@/lib/utils";

export function ArchiveButton({
  applicationId,
  archived,
  variant = "icon",
  className,
}: {
  applicationId: string;
  archived: boolean;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      try {
        if (archived) {
          await unarchiveApplication(applicationId);
          toast.success("Application unarchived");
        } else {
          await archiveApplication(applicationId);
          toast.success("Application archived");
        }
        router.refresh();
      } catch {
        toast.error(archived ? "Failed to unarchive application" : "Failed to archive application");
      }
    });
  }

  const Icon = archived ? ArchiveRestore : Archive;
  const label = archived ? "Unarchive" : "Archive";
  const pendingLabel = archived ? "Unarchiving..." : "Archiving...";

  if (variant === "button") {
    return (
      <Button type="button" variant="outline" disabled={pending} onClick={handleToggle} className={className}>
        <Icon className="h-4 w-4" />
        {pending ? pendingLabel : label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={archived ? "Unarchive this application" : "Archive this application"}
      disabled={pending}
      onClick={handleToggle}
      className={cn("rounded p-1 hover:bg-accent hover:text-foreground disabled:opacity-50", className)}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
