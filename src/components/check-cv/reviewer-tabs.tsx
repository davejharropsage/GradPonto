"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { reviewModes, reviewModeLabels, type ReviewMode } from "@/lib/labels";

/**
 * The Application Reviewer's mode switcher. Each panel is rendered on the server and passed in —
 * this component only owns which one is showing, kept in the URL (?mode=...) so it survives a
 * refresh or a shared link, the same way Find placements keeps its search in ?q=/?where=.
 */
export function ReviewerTabs({
  mode,
  applicationId,
  match,
  health,
  ats,
  cover,
}: {
  mode: ReviewMode;
  applicationId?: string;
  match: ReactNode;
  health: ReactNode;
  ats: ReactNode;
  cover: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const panels: Record<ReviewMode, ReactNode> = { match, health, ats, cover };

  function go(next: string) {
    const params = new URLSearchParams({ mode: next });
    if (applicationId) params.set("applicationId", applicationId);
    startTransition(() => router.push(`/check-cv?${params.toString()}`));
  }

  return (
    <Tabs value={mode} onValueChange={(value) => go(String(value))}>
      <TabsList className="mb-4">
        {reviewModes.map((m) => (
          <TabsTrigger key={m} value={m}>
            {reviewModeLabels[m]}
          </TabsTrigger>
        ))}
      </TabsList>
      {reviewModes.map((m) => (
        <TabsContent key={m} value={m}>
          {panels[m]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
