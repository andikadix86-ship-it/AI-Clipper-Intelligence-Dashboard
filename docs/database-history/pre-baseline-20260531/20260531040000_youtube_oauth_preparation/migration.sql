ALTER TABLE "SocialAccount"
ADD COLUMN IF NOT EXISTS "platformAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "platformAccountName" TEXT,
ADD COLUMN IF NOT EXISTS "platformAccountAvatar" TEXT;

CREATE TABLE IF NOT EXISTS "GoogleOAuthSetting" (
  "id" TEXT NOT NULL,
  "clientIdEncrypted" TEXT NOT NULL DEFAULT '',
  "clientSecretEncrypted" TEXT NOT NULL DEFAULT '',
  "redirectUri" TEXT NOT NULL DEFAULT '',
  "status" "ProviderStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "lastTestAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleOAuthSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OAuthCredential" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "socialAccountId" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT,
  "scope" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OAuthCredential_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "OAuthCredential" ADD CONSTRAINT "OAuthCredential_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
