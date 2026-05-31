ALTER TABLE "SocialAccount"
ADD COLUMN IF NOT EXISTS "permissionStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED';

CREATE TABLE IF NOT EXISTS "OAuthProviderSetting" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "clientIdEncrypted" TEXT NOT NULL DEFAULT '',
  "clientSecretEncrypted" TEXT NOT NULL DEFAULT '',
  "redirectUri" TEXT NOT NULL DEFAULT '',
  "status" "ProviderStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "lastTestAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OAuthProviderSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OAuthProviderSetting_provider_key" ON "OAuthProviderSetting"("provider");
