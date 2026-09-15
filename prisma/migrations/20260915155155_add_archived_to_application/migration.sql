-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT,
    "description" TEXT,
    "source" TEXT,
    "salary" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "appliedAt" DATETIME,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "employerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("appliedAt", "createdAt", "deadline", "description", "employerId", "id", "jobUrl", "location", "notes", "priority", "salary", "source", "status", "title", "updatedAt") SELECT "appliedAt", "createdAt", "deadline", "description", "employerId", "id", "jobUrl", "location", "notes", "priority", "salary", "source", "status", "title", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE INDEX "Application_employerId_idx" ON "Application"("employerId");
CREATE INDEX "Application_status_idx" ON "Application"("status");
CREATE INDEX "Application_deadline_idx" ON "Application"("deadline");
CREATE INDEX "Application_archived_idx" ON "Application"("archived");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
