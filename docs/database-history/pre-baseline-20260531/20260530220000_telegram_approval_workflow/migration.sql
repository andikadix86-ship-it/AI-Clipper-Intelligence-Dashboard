CREATE TYPE "TelegramStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED');
CREATE TYPE "TelegramApprovalAction" AS ENUM ('SENT_REVIEW', 'SENT_APPROVED', 'APPROVED', 'REJECTED', 'TEST');
CREATE TYPE "TelegramLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RESPONDED');

CREATE TABLE "TelegramSetting" (
  "id" TEXT NOT NULL,
  "botTokenEncrypted" TEXT NOT NULL DEFAULT '',
  "chatId" TEXT NOT NULL DEFAULT '',
  "status" "TelegramStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "lastTestAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TelegramSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramApprovalLog" (
  "id" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "action" "TelegramApprovalAction" NOT NULL,
  "telegramMessageId" TEXT,
  "telegramChatId" TEXT,
  "status" "TelegramLogStatus" NOT NULL DEFAULT 'PENDING',
  "responseBy" TEXT,
  "responseAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramApprovalLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TelegramApprovalLog"
ADD CONSTRAINT "TelegramApprovalLog_contentItemId_fkey"
FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
