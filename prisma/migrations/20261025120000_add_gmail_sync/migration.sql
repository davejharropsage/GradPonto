-- CreateEnum
CREATE TYPE "GmailProposalKind" AS ENUM ('NEW_APPLICATION', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "GmailProposalState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "GmailConnection" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshTokenSealed" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailProposal" (
    "id" TEXT NOT NULL,
    "kind" "GmailProposalKind" NOT NULL,
    "state" "GmailProposalState" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "company" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "jobUrl" TEXT,
    "reference" TEXT,
    "event" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "proposedStatus" "ApplicationStatus" NOT NULL,
    "applicationId" TEXT,
    "fromStatus" "ApplicationStatus",
    "userId" TEXT NOT NULL DEFAULT '',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailConnection_userId_key" ON "GmailConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailMessage_userId_messageId_key" ON "GmailMessage"("userId", "messageId");

-- CreateIndex
CREATE INDEX "GmailProposal_userId_state_idx" ON "GmailProposal"("userId", "state");

-- CreateIndex
CREATE INDEX "GmailProposal_applicationId_idx" ON "GmailProposal"("applicationId");

-- AddForeignKey
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailProposal" ADD CONSTRAINT "GmailProposal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailProposal" ADD CONSTRAINT "GmailProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

