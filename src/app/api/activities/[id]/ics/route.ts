import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth/user";
import { buildIcsEvent } from "@/lib/ics";
import { activityTypeLabels } from "@/lib/labels";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const activity = await ctx.db.activity.findUnique({
    where: { id },
    include: { application: { include: { employer: true } } },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!activity.dueDate) return NextResponse.json({ error: "This activity has no date to export" }, { status: 404 });

  const employerName = activity.application?.employer?.name;
  const jobTitle = activity.application?.title;
  const summary = employerName
    ? `${activityTypeLabels[activity.type]}: ${employerName}${jobTitle ? ` — ${jobTitle}` : ""}`
    : activity.subject;

  const ics = buildIcsEvent({
    uid: `${activity.id}@gradponto`,
    summary,
    start: activity.dueDate,
    location: activity.location,
    description: activity.notes,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="gradponto-${activity.id}.ics"`,
    },
  });
}
