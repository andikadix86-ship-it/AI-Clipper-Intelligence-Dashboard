CREATE TYPE "LibraryAssetStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'TRASHED');

ALTER TABLE "ContentItem"
ADD COLUMN "parentAssetId" TEXT,
ADD COLUMN "assetStatus" "LibraryAssetStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "versionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "isLatestVersion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "versionNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "trashedAt" TIMESTAMP(3);

ALTER TABLE "ContentItem"
ADD CONSTRAINT "ContentItem_parentAssetId_fkey"
FOREIGN KEY ("parentAssetId") REFERENCES "ContentItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AssetCollection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetCollectionItem" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetCollectionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetCollectionItem_collectionId_contentItemId_key"
ON "AssetCollectionItem"("collectionId", "contentItemId");

ALTER TABLE "AssetCollection"
ADD CONSTRAINT "AssetCollection_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssetCollectionItem"
ADD CONSTRAINT "AssetCollectionItem_collectionId_fkey"
FOREIGN KEY ("collectionId") REFERENCES "AssetCollection"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetCollectionItem"
ADD CONSTRAINT "AssetCollectionItem_contentItemId_fkey"
FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
