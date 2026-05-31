ALTER TABLE "GenerationJob"
ADD COLUMN "outputUrl" TEXT,
ADD COLUMN "duration" INTEGER,
ADD COLUMN "providerMode" "ProviderMode" NOT NULL DEFAULT 'DUMMY';
