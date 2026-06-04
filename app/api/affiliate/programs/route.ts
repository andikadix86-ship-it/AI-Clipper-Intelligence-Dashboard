import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const programs = await withTimeout(prisma.affiliateProgram.findMany({ include: { accounts: true }, orderBy: { updatedAt: "desc" } }));
    return apiSuccess("Affiliate programs loaded.", { programs }, { programs });
  } catch {
    return apiError("Affiliate programs belum dapat dimuat dari Supabase.", 503);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body || !required(body, ["name", "website", "dashboardUrl", "affiliateLink"])) return apiError("Affiliate program payload tidak lengkap.", 400);
  try {
    const program = await withTimeout(prisma.affiliateProgram.create({ data: {
      name: String(body.name),
      website: String(body.website),
      dashboardUrl: String(body.dashboardUrl),
      affiliateLink: String(body.affiliateLink),
      commissionInfo: String(body.commissionInfo ?? ""),
      products: products(body.products),
      notes: String(body.notes ?? ""),
      status: String(body.status ?? "ACTIVE")
    } }));
    await writeAuditLog({ action: "AFFILIATE_PROGRAM_CREATED", entityType: "AffiliateProgram", entityId: program.id, message: `Affiliate program created: ${program.name}.`, metadata: { website: program.website, status: program.status } });
    return apiSuccess("Affiliate program tersimpan ke Supabase.", { program }, { program }, 201);
  } catch {
    return apiError("Affiliate program gagal disimpan ke Supabase.", 503);
  }
}

function required(body: Record<string, unknown>, fields: string[]) { return fields.every((field) => typeof body[field] === "string" && body[field]); }
function products(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : []; }
