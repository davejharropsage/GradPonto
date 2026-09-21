import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth/user";
import { getBackupData } from "@/lib/data/backup";

export async function GET() {
  if (!(await getApiContext())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const data = await getBackupData();
  const filename = `gradponto-backup-${data.exportedAt.slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
