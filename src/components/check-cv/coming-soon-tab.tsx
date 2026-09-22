import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** A Reviewer mode that isn't built yet — same slot the real mode will occupy once it ships. */
export function ComingSoonTab({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
        <Icon className="mb-1 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
