"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startImpersonation } from "@/lib/actions/admin";

export function ImpersonateButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await startImpersonation(userId);
            router.push("/");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't start impersonating.");
          }
        })
      }
    >
      <UserCog className="h-4 w-4" />
      View as
    </Button>
  );
}
