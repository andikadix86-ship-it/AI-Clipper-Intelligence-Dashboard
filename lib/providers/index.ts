import type { AIProviderName, ProviderMode } from "@/lib/types";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { dummyProvider } from "@/lib/providers/dummy";
import { geminiProvider } from "@/lib/providers/gemini";
import { lumaProvider } from "@/lib/providers/luma";
import { openaiProvider } from "@/lib/providers/openai";
import { pikaProvider } from "@/lib/providers/pika";
import { runwayProvider } from "@/lib/providers/runway";
import type { AIProviderAdapter } from "@/lib/providers/types";

const adapters: Record<AIProviderName, AIProviderAdapter> = {
  GEMINI_VEO: geminiProvider,
  OPENAI_SORA: openaiProvider,
  RUNWAY: runwayProvider,
  PIKA: pikaProvider,
  LUMA: lumaProvider,
  MANUAL_UPLOAD: dummyProvider
};

export function encodeApiKey(key: string) {
  return Buffer.from(key, "utf8").toString("base64");
}

export function decodeApiKey(key?: string | null) {
  if (!key) return "";
  try {
    return Buffer.from(key, "base64").toString("utf8");
  } catch {
    return key;
  }
}

export function maskApiKey(key?: string | null) {
  const decoded = decodeApiKey(key);
  if (!decoded) return "";
  return `${decoded.slice(0, 5)}...${decoded.slice(-4)}`;
}

export type ProviderCredentialSource = "database" | "env" | "none";

function envApiKey(providerName: AIProviderName) {
  if (providerName === "OPENAI_SORA") return process.env.OPENAI_API_KEY ?? "";
  if (providerName === "GEMINI_VEO") return process.env.GEMINI_API_KEY ?? "";
  return "";
}

export async function resolveProviderCredential(providerName: AIProviderName) {
  const provider = await withTimeout(
    prisma.aIProvider.findUnique({
      where: { name: providerName },
      include: { credentials: { orderBy: { updatedAt: "desc" }, take: 1 } }
    }),
    5000
  );
  const databaseKey = decodeApiKey(provider?.credentials[0]?.apiKeyEncrypted ?? provider?.apiKey);
  const environmentKey = envApiKey(providerName);
  const source: ProviderCredentialSource = databaseKey ? "database" : environmentKey ? "env" : "none";
  const apiKey = databaseKey || environmentKey;

  // Temporary provider diagnostics. Never print credentials or masked fragments.
  console.info("[provider-debug] credential resolution", {
    provider: providerName,
    providerFound: Boolean(provider),
    apiKeyFound: Boolean(apiKey),
    source,
    isActive: provider?.isActive ?? false,
    mode: provider?.mode ?? "DUMMY"
  });

  return { provider, apiKey, source };
}

export async function getProviderRuntime(providerName: AIProviderName, requestedMode?: ProviderMode) {
  const { provider, apiKey, source } = await resolveProviderCredential(providerName);
  const mode = requestedMode ?? provider?.mode ?? "DUMMY";
  const safeMode: ProviderMode = mode === "REAL" && apiKey && provider?.isActive ? "REAL" : "DUMMY";
  return {
    adapter: adapters[providerName] ?? dummyProvider,
    apiKey,
    mode: safeMode,
    provider,
    credentialSource: source,
    warning: mode === "REAL" && safeMode === "DUMMY" ? "Provider Real mode requested but API key or active provider is missing. Dummy fallback used." : undefined
  };
}
