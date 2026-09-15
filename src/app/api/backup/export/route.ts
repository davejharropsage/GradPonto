import { NextResponse } from "next/server";
import { getBackupData } from "@/lib/data/backup";

export async function GET() {
  const data = await getBackupData();
  const filename = `placementpilot-backup-${data.exportedAt.slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
