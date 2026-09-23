"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { stopImpersonation } from "@/lib/actions/admin";

export function ImpersonationBanner({ realEmail, targetEmail }: { realEmail: string; targetEmail: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex h-9 items-center justify-center gap-2 bg-amber-500 px-3 text-center text-xs font-medium text-amber-950 print:hidden">
      <UserCog className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        Viewing as <b>{targetEmail}</b>, signed in as {realEmail}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-6 shrink-0 border-amber-950/30 bg-transparent px-2 text-[11px] text-amber-950 hover:bg-amber-950/10"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await stopImpersonation();
              router.push("/admin");
              router.refresh();
            } catch {
              toast.error("Couldn't return to admin.");
            }
          })
        }
      >
        Return to admin
      </Button>
    </div>
  );
}
