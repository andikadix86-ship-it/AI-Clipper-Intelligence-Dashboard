import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { defaultProviders } from "@/lib/dummy-creative";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { providerStatusForSave, resolvedProviderStatus } from "@/lib/provider-status";
import { encodeApiKey, maskApiKey, resolveProviderCredential } from "@/lib/providers";
import { maskSecret } from "@/lib/security";
import type { AIProviderName, ProviderMode } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const providers = await withTimeout(prisma.aIProvider.findMany({ orderBy: { name: "asc" }, include: { credentials: { orderBy: { updatedAt: "desc" }, take: 1 } } }), 4000);
    const sanitized = providers.map(({ apiKey: _apiKey, credentials, ...provider }) => {
      const storedKey = credentials[0]?.apiKeyEncrypted ?? _apiKey;
      return {
        ...provider,
        providerStatus: resolvedProviderStatus({ mode: provider.mode, hasApiKey: Boolean(storedKey), lastTestStatus: provider.lastTestStatus }),
        lastTestAt: provider.lastTestAt?.toISOString(),
        apiKeyMasked: maskApiKey(storedKey)
      };
    });
    const data = sanitized.length ? sanitized : defaultProviders;
    return apiSuccess("Providers loaded.", { providers: data }, { providers: data });
  } catch {
    return apiSuccess("Providers loaded from dummy fallback.", { providers: defaultProviders }, { providers: defaultProviders });
  }
}

export async function POST(request: Request) {
  let body: {
    name: AIProviderName;
    apiKey?: string;
    mode?: ProviderMode;
    dailyLimit: number;
    usedToday: number;
    resetTime: string;
    isActive: boolean;
  };

  body = (await parseJsonBody<typeof body>(request)) as typeof body;
  if (!body) return apiError("Invalid JSON body.", 400);

  if (!body.name) {
    return apiError("Provider name is required.", 400);
  }

  try {
    const current = await resolveProviderCredential(body.name);
    const hasApiKey = Boolean(body.apiKey || current.apiKey);
    const mode = body.mode ?? "DUMMY";
    const providerStatus = providerStatusForSave(mode, hasApiKey);
    const provider = await withTimeout(
      prisma.aIProvider.upsert({
        where: { name: body.name },
        update: {
          apiKey: body.apiKey ? encodeApiKey(body.apiKey) : undefined,
          status: hasApiKey ? "CONNECTED" : "NOT_CONNECTED",
          providerStatus,
          lastTestAt: null,
          lastTestStatus: null,
          lastTestError: null,
          mode,
          dailyLimit: Number(body.dailyLimit) || 0,
          usedToday: Number(body.usedToday) || 0,
          resetTime: body.resetTime || "00:00",
          isActive: body.isActive && hasApiKey
        },
        create: {
          name: body.name,
          apiKey: body.apiKey ? encodeApiKey(body.apiKey) : undefined,
          status: hasApiKey ? "CONNECTED" : "NOT_CONNECTED",
          providerStatus,
          lastTestAt: null,
          lastTestStatus: null,
          lastTestError: null,
          mode,
          dailyLimit: Number(body.dailyLimit) || 0,
          usedToday: Number(body.usedToday) || 0,
          resetTime: body.resetTime || "00:00",
          isActive: body.isActive && hasApiKey
        }
      }),
      5000
    );
    if (body.apiKey) {
      await withTimeout(
        prisma.providerCredential.create({
          data: {
            providerId: provider.id,
            apiKeyEncrypted: encodeApiKey(body.apiKey)
          }
        }),
        5000
      );
    }
    const { apiKey: _apiKey, ...sanitized } = provider;
    const responseProvider = { ...sanitized, apiKeyMasked: body.apiKey || current.apiKey ? maskSecret(body.apiKey || current.apiKey) : maskApiKey(provider.apiKey) };
    await writeAuditLog({
      action: "SAVE_PROVIDER_SETTINGS",
      entityType: "AIProvider",
      entityId: provider.id,
      message: `Provider settings saved for ${provider.name}.`,
      metadata: { provider: provider.name, mode: provider.mode, hasApiKey, credentialSource: body.apiKey ? "database:new" : current.source, apiKeyMasked: maskSecret(body.apiKey) }
    });
    return apiSuccess("Provider settings saved.", { provider: responseProvider }, { provider: responseProvider });
  } catch (error) {
    return apiError("Provider settings could not be saved to Supabase.", 500, error);
  }
}
