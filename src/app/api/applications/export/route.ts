import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth/user";
import { toCsv } from "@/lib/csv";
import { applicationStatusLabels, priorityLabels } from "@/lib/labels";

function toIsoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export async function GET() {
  const ctx = await getApiContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const applications = await ctx.db.application.findMany({
    include: { employer: true },
    orderBy: { createdAt: "asc" },
  });

  const headers = [
    "Title",
    "Company",
    "Location",
    "Status",
    "Archived",
    "Priority",
    "Salary",
    "Source",
    "Job URL",
    "Deadline",
    "Applied At",
    "Created At",
    "Updated At",
    "Notes",
  ];

  const rows = applications.map((application) => [
    application.title,
    application.employer?.name ?? "",
    application.location ?? "",
    applicationStatusLabels[application.status] ?? application.status,
    application.archived ? "Yes" : "No",
    priorityLabels[application.priority] ?? application.priority,
    application.salary ?? "",
    application.source ?? "",
    application.jobUrl ?? "",
    toIsoDate(application.deadline),
    toIsoDate(application.appliedAt),
    toIsoDate(application.createdAt),
    toIsoDate(application.updatedAt),
    application.notes ?? "",
  ]);

  const csv = toCsv(headers, rows);
  const filename = `gradponto-applications-${toIsoDate(new Date())}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
