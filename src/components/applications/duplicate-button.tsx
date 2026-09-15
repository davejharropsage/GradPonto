"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { duplicateApplication } from "@/lib/actions/applications";
import { cn } from "@/lib/utils";

export function DuplicateButton({
  applicationId,
  variant = "icon",
  className,
}: {
  applicationId: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDuplicate() {
    startTransition(async () => {
      try {
        const newId = await duplicateApplication(applicationId);
        toast.success("Application duplicated");
        router.push(`/applications/${newId}/edit`);
      } catch {
        toast.error("Failed to duplicate application");
      }
    });
  }

  if (variant === "button") {
    return (
      <Button type="button" variant="outline" disabled={pending} onClick={handleDuplicate} className={className}>
        <Copy className="h-4 w-4" />
        {pending ? "Duplicating..." : "Duplicate"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Duplicate this application"
      disabled={pending}
      onClick={handleDuplicate}
      className={cn("rounded p-1 hover:bg-accent hover:text-foreground disabled:opacity-50", className)}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}
