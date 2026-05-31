import { prisma } from "@/lib/prisma";
import { decodeSecret, encodeSecret, maskSecret } from "@/lib/security";
import { getRedditOAuthStatus } from "@/lib/intelligence/reddit-oauth";
import { getYouTubeQuotaSummary } from "@/lib/intelligence/youtube-quota";

export type IntelligenceProviderStatus = "CONNECTED" | "MISSING" | "ERROR" | "QUOTA_LIMITED" | "DEMO";

export async function resolveYouTubeDataApiKey() {
  const setting = await prisma.intelligenceProviderSetting.findUnique({ where: { provider: "YOUTUBE_DATA_API" } });
  const databaseKey = decodeSecret(setting?.apiKeyEncrypted);
  const environmentKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || "";
  return {
    setting,
    apiKey: databaseKey || environmentKey,
    source: databaseKey ? "database" : environmentKey ? "env" : "none"
  } as const;
}

export async function getIntelligenceProviderSettings() {
  const youtube = await resolveYouTubeDataApiKey();
  const quota = await getYouTubeQuotaSummary();
  const reddit = getRedditOAuthStatus();
  return [
    {
      provider: "YOUTUBE_DATA_API",
      label: "YouTube Data API",
      status: youtube.setting?.status ?? (youtube.apiKey ? "CONNECTED" : "MISSING"),
      apiKeyMasked: youtube.apiKey ? maskSecret(youtube.apiKey) : "",
      credentialSource: youtube.source,
      lastError: youtube.setting?.lastError ?? "",
      lastCheckedAt: youtube.setting?.lastCheckedAt?.toISOString(),
      quota
    },
    {
      provider: "GOOGLE_TRENDS",
      label: "Google Trends",
      status: "DEMO",
      apiKeyMasked: "",
      credentialSource: "demo",
      lastError: "",
      lastCheckedAt: undefined
    },
    {
      provider: "REDDIT_OAUTH",
      label: "Reddit OAuth",
      status: reddit.status,
      apiKeyMasked: reddit.clientIdMasked,
      credentialSource: "env",
      lastError: reddit.status === "READY" ? "" : reddit.message,
      lastCheckedAt: undefined
    }
  ];
}

export async function saveYouTubeDataApiKey(apiKey?: string) {
  const current = await prisma.intelligenceProviderSetting.findUnique({ where: { provider: "YOUTUBE_DATA_API" } });
  const hasKey = Boolean(apiKey || current?.apiKeyEncrypted || process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY);
  await prisma.intelligenceProviderSetting.upsert({
    where: { provider: "YOUTUBE_DATA_API" },
    update: {
      apiKeyEncrypted: apiKey ? encodeSecret(apiKey) : undefined,
      status: hasKey ? "CONNECTED" : "MISSING",
      lastError: null
    },
    create: {
      provider: "YOUTUBE_DATA_API",
      apiKeyEncrypted: apiKey ? encodeSecret(apiKey) : undefined,
      status: hasKey ? "CONNECTED" : "MISSING"
    }
  });
  return getIntelligenceProviderSettings();
}

export async function updateYouTubeProviderStatus(status: IntelligenceProviderStatus, lastError?: string) {
  await prisma.intelligenceProviderSetting.upsert({
    where: { provider: "YOUTUBE_DATA_API" },
    update: { status, lastError, lastCheckedAt: new Date() },
    create: { provider: "YOUTUBE_DATA_API", status, lastError, lastCheckedAt: new Date() }
  });
}
