import { requireRegisteredUser, userDb } from "@/lib/auth/user";

export const BACKUP_VERSION = 1;

// Rows carry an internal `userId`. It means nothing outside this database and would only
// make the file less portable, so it is left out of backups.
function withoutOwner<T extends { userId: string }>(row: T): Omit<T, "userId"> {
  const copy = { ...row } as Partial<T>;
  delete copy.userId;
  return copy as Omit<T, "userId">;
}

export async function getBackupData() {
  const [user, db] = await Promise.all([requireRegisteredUser(), userDb()]);
  const [employers, applications, baseDocuments, goals, inbox, receivedEmails, emailSuggestions] = await Promise.all([
    db.employer.findMany(),
    db.application.findMany({
      include: { documents: true, activities: true },
    }),
    db.document.findMany({ where: { applicationId: null } }),
    db.goal.findMany(),
    db.emailInbox.findUnique({ where: { userId: user.id } }),
    db.inboundEmail.findMany({ orderBy: { createdAt: "asc" } }),
    db.emailSuggestion.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { name: user.name, plan: user.plan },
    employers: employers.map(withoutOwner),
    applications: applications.map((application) => ({
      ...withoutOwner(application),
      documents: application.documents.map(withoutOwner),
      activities: application.activities.map(withoutOwner),
    })),
    baseDocuments: baseDocuments.map(withoutOwner),
    goals: goals.map(withoutOwner),
    // Email import, so the download is a complete copy of the user's data (privacy policy). Restore
    // ignores it: the forwarding address and email history belong to this account, not a backup.
    emailImport: {
      inbox: inbox && withoutOwner(inbox),
      receivedEmails: receivedEmails.map((email) => withoutOwner({ ...email, claimId: undefined })),
      suggestions: emailSuggestions.map(withoutOwner),
    },
  };
}

export type BackupData = Awaited<ReturnType<typeof getBackupData>>;
