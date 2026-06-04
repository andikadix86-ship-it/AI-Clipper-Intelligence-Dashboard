import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }
  try {
    const account = await withTimeout(prisma.affiliateAccount.update({
      where: { id: params.id },
      data: {
        programId: optional(body.programId),
        platform: text(body.platform),
        accountName: text(body.accountName),
        handle: text(body.handle),
        niche: text(body.niche),
        role: text(body.role),
        affiliateDashboardUrl: optional(body.affiliateDashboardUrl),
        affiliateLink: optional(body.affiliateLink),
        commissionInfo: text(body.commissionInfo),
        notes: text(body.notes),
        status: text(body.status) || "ACTIVE"
      },
      include: { program: true }
    }));
    return NextResponse.json({ success: true, message: "Affiliate account updated.", account });
  } catch (error) {
    serverLogger.error("affiliate.account.update_failed", error);
    return NextResponse.json({ success: false, message: "Affiliate account gagal diperbarui." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const account = await withTimeout(prisma.affiliateAccount.update({ where: { id: params.id }, data: { status: "ARCHIVED" }, include: { program: true } }));
    return NextResponse.json({ success: true, message: "Affiliate account archived.", account });
  } catch (error) {
    serverLogger.error("affiliate.account.archive_failed", error);
    return NextResponse.json({ success: false, message: "Affiliate account gagal diarsipkan." }, { status: 503 });
  }
}

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optional(value: unknown) { const result = text(value); return result || undefined; }
