import { apiError, apiSuccess } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { providerStatusLabel, resolvedProviderStatus } from "@/lib/provider-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasEnvironmentKey(provider: string) {
  if (provider === "OPENAI_SORA") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "GEMINI_VEO") return Boolean(process.env.GEMINI_API_KEY);
  return false;
}

export async function GET() {
  try {
    const [providers, telegram, google, oauth, logs] = await withTimeout(
      Promise.all([
        prisma.aIProvider.findMany({ orderBy: { name: "asc" }, include: { credentials: { orderBy: { updatedAt: "desc" }, take: 1 } } }),
        prisma.telegramSetting.findFirst({ orderBy: { updatedAt: "desc" } }),
        prisma.googleOAuthSetting.findFirst({ orderBy: { updatedAt: "desc" } }),
        prisma.oAuthProviderSetting.findMany(),
        prisma.auditLog.findMany({
          where: { action: { startsWith: "PROVIDER_TEST" } },
          orderBy: { createdAt: "desc" },
          take: 30
        })
      ]),
      8000
    );

    const rows = [
      ...providers.map((provider) => {
        const hasDatabaseKey = Boolean(provider.credentials[0]?.apiKeyEncrypted || provider.apiKey);
        const hasEnvKey = hasEnvironmentKey(provider.name);
        const hasKey = hasDatabaseKey || hasEnvKey;
        const latest = logs.find((log) => log.entityId === provider.id || log.entityId === provider.name);
        const providerStatus = resolvedProviderStatus({ mode: provider.mode, hasApiKey: hasKey, lastTestStatus: provider.lastTestStatus });
        console.info("[provider-debug] status resolution", {
          provider: provider.name,
          providerFound: true,
          apiKeyFound: hasKey,
          source: hasDatabaseKey ? "database" : hasEnvKey ? "env" : "none",
          isActive: provider.isActive,
          mode: provider.mode,
          lastTestResult: provider.lastTestStatus ?? latest?.action ?? "never-tested"
        });
        return {
          provider: provider.name,
          status: providerStatusLabel(providerStatus),
          providerStatus,
          isActive: provider.isActive,
          hasCredential: hasKey,
          lastTest: provider.lastTestAt?.toISOString(),
          lastTestStatus: provider.lastTestStatus,
          errorMessage: provider.lastTestError ?? "",
          dailyLimit: provider.dailyLimit,
          usedToday: provider.usedToday,
          mode: provider.mode
        };
      }),
      {
        provider: "Telegram Bot",
        status: telegram?.status === "CONNECTED" ? "Ready" : telegram?.status === "ERROR" ? "Error" : "Not Configured",
        lastTest: telegram?.lastTestAt?.toISOString(),
        errorMessage: "",
        dailyLimit: 0,
        usedToday: 0,
        mode: telegram?.status === "CONNECTED" ? "REAL" : "DUMMY"
      },
      {
        provider: "YouTube OAuth",
        status: google?.status === "CONNECTED" || process.env.GOOGLE_CLIENT_ID ? "Ready" : "Not Configured",
        lastTest: google?.lastTestAt?.toISOString(),
        errorMessage: "",
        dailyLimit: 0,
        usedToday: 0,
        mode: google?.status === "CONNECTED" || process.env.GOOGLE_CLIENT_ID ? "REAL" : "DUMMY"
      },
      ...["TIKTOK", "META"].map((provider) => {
        const setting = oauth.find((item) => item.provider === provider);
        return {
          provider: `${provider} OAuth`,
          status: setting?.status === "CONNECTED" ? "Ready" : "Not Configured",
          lastTest: setting?.lastTestAt?.toISOString(),
          errorMessage: "",
          dailyLimit: 0,
          usedToday: 0,
          mode: setting?.status === "CONNECTED" ? "REAL" : "DUMMY"
        };
      })
    ];
    return apiSuccess("Provider status loaded.", { providers: rows }, { providers: rows });
  } catch (error) {
    return apiError("Provider status could not be loaded.", 500, error);
  }
}
