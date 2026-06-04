import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await withTimeout(prisma.affiliateAccount.findMany({ include: { program: true }, orderBy: [{ platform: "asc" }, { updatedAt: "desc" }] }));
    return apiSuccess("Affiliate accounts loaded.", { accounts }, { accounts });
  } catch {
    return apiError("Affiliate accounts belum dapat dimuat dari Supabase.", 503);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body || !required(body, ["platform", "accountName", "handle", "niche", "role", "status"])) return apiError("Affiliate account payload tidak lengkap.", 400);
  try {
    const account = await withTimeout(prisma.affiliateAccount.create({ data: {
      platform: String(body.platform),
      accountName: String(body.accountName),
      handle: String(body.handle),
      niche: String(body.niche),
      role: String(body.role),
      affiliateDashboardUrl: optional(body.affiliateDashboardUrl),
      affiliateLink: optional(body.affiliateLink),
      commissionInfo: String(body.commissionInfo ?? ""),
      notes: String(body.notes ?? ""),
      status: String(body.status),
      programId: optional(body.programId)
    }, include: { program: true } }));
    await writeAuditLog({ action: "AFFILIATE_ACCOUNT_CREATED", entityType: "AffiliateAccount", entityId: account.id, message: `Affiliate account created: ${account.accountName}.`, metadata: { platform: account.platform, role: account.role, status: account.status } });
    return apiSuccess("Affiliate account tersimpan ke Supabase.", { account }, { account }, 201);
  } catch {
    return apiError("Affiliate account gagal disimpan ke Supabase.", 503);
  }
}

function required(body: Record<string, unknown>, fields: string[]) { return fields.every((field) => typeof body[field] === "string" && body[field]); }
function optional(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
