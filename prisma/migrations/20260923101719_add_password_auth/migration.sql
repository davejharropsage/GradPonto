-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'SIGNUP',
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_LoginCode" ("attempts", "codeHash", "consumedAt", "createdAt", "email", "expiresAt", "id") SELECT "attempts", "codeHash", "consumedAt", "createdAt", "email", "expiresAt", "id" FROM "LoginCode";
DROP TABLE "LoginCode";
ALTER TABLE "new_LoginCode" RENAME TO "LoginCode";
CREATE INDEX "LoginCode_email_purpose_createdAt_idx" ON "LoginCode"("email", "purpose", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
