CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "dashboardUrl" TEXT NOT NULL,
    "affiliateLink" TEXT NOT NULL,
    "commissionInfo" TEXT NOT NULL DEFAULT '',
    "products" JSONB,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateAccount" (
    "id" TEXT NOT NULL,
    "programId" TEXT,
    "platform" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "affiliateDashboardUrl" TEXT,
    "affiliateLink" TEXT,
    "commissionInfo" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AffiliateAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignAccount" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "affiliateAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateProgram_status_updatedAt_idx" ON "AffiliateProgram"("status", "updatedAt");
CREATE INDEX "AffiliateAccount_platform_status_idx" ON "AffiliateAccount"("platform", "status");
CREATE INDEX "AffiliateAccount_programId_updatedAt_idx" ON "AffiliateAccount"("programId", "updatedAt");
CREATE UNIQUE INDEX "CampaignAccount_campaignId_affiliateAccountId_key" ON "CampaignAccount"("campaignId", "affiliateAccountId");
CREATE INDEX "CampaignAccount_affiliateAccountId_createdAt_idx" ON "CampaignAccount"("affiliateAccountId", "createdAt");

ALTER TABLE "AffiliateAccount" ADD CONSTRAINT "AffiliateAccount_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignAccount" ADD CONSTRAINT "CampaignAccount_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AffiliateCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAccount" ADD CONSTRAINT "CampaignAccount_affiliateAccountId_fkey" FOREIGN KEY ("affiliateAccountId") REFERENCES "AffiliateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
