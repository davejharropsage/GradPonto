import { db } from "@/lib/db";

export const BACKUP_VERSION = 1;

export async function getBackupData() {
  const [profile, employers, applications, baseDocuments, goals] = await Promise.all([
    db.profile.findUnique({ where: { id: "default" } }),
    db.employer.findMany(),
    db.application.findMany({
      include: { documents: true, activities: true },
    }),
    db.document.findMany({ where: { applicationId: null } }),
    db.goal.findMany(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: profile ? { name: profile.name, plan: profile.plan } : null,
    employers,
    applications,
    baseDocuments,
    goals,
  };
}

export type BackupData = Awaited<ReturnType<typeof getBackupData>>;
