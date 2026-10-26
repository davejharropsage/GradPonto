-- CreateEnum
CREATE TYPE "InboundEmailStatus" AS ENUM ('QUEUED', 'PROCESSING', 'DONE');

-- CreateEnum
CREATE TYPE "EmailSuggestionKind" AS ENUM ('NEW_APPLICATION', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "EmailSuggestionState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EmailInbox" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "knownAddresses" TEXT[],
    "forwardingCode" TEXT,
    "forwardingUrl" TEXT,
    "forwardingFrom" TEXT,
    "forwardingRequestedAt" TIMESTAMP(3),
    "lastReceivedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailInbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "messageKey" TEXT NOT NULL,
    "originalMessageId" TEXT,
    "sender" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "bodyText" TEXT,
    "status" "InboundEmailStatus" NOT NULL DEFAULT 'QUEUED',
    "outcome" TEXT,
    "claimId" TEXT,
    "userId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSuggestion" (
    "id" TEXT NOT NULL,
    "kind" "EmailSuggestionKind" NOT NULL,
    "state" "EmailSuggestionState" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "originalMessageId" TEXT,
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

    CONSTRAINT "EmailSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailInbox_token_key" ON "EmailInbox"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailInbox_userId_key" ON "EmailInbox"("userId");

-- CreateIndex
CREATE INDEX "InboundEmail_userId_status_idx" ON "InboundEmail"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEmail_userId_messageKey_key" ON "InboundEmail"("userId", "messageKey");

-- CreateIndex
CREATE INDEX "EmailSuggestion_userId_state_idx" ON "EmailSuggestion"("userId", "state");

-- CreateIndex
CREATE INDEX "EmailSuggestion_applicationId_idx" ON "EmailSuggestion"("applicationId");

-- AddForeignKey
ALTER TABLE "EmailInbox" ADD CONSTRAINT "EmailInbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSuggestion" ADD CONSTRAINT "EmailSuggestion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSuggestion" ADD CONSTRAINT "EmailSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

