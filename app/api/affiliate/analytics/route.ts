import { NextResponse } from "next/server";
import type { SocialPlatform } from "@prisma/client";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshots = await withTimeout(prisma.platformPerformanceSnapshot.findMany({ orderBy: { snapshotDate: "desc" }, take: 50, include: { socialAccount: true } }));
    const totals = snapshots.reduce((acc, row) => ({
      views: acc.views + row.views,
      engagement: acc.engagement + row.likes + row.comments + row.shares + row.saves,
      clicks: acc.clicks + row.clicks,
      sales: acc.sales + row.sales,
      commission: acc.commission + row.commission
    }), { views: 0, engagement: 0, clicks: 0, sales: 0, commission: 0 });
    return NextResponse.json({ success: true, snapshots, summary: { ...totals, engagementRate: totals.views ? Number(((totals.engagement / totals.views) * 100).toFixed(2)) : 0, conversionRate: totals.clicks ? Number(((totals.sales / totals.clicks) * 100).toFixed(2)) : 0 } });
  } catch (error) {
    serverLogger.error("affiliate.analytics.list_failed", error);
    return NextResponse.json({ success: false, message: "Analytics data belum dapat dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return bad("Invalid JSON body."); }
  const campaignId = text(body.campaignId);
  const generatedContentId = text(body.generatedContentId);
  const affiliateAccountId = text(body.affiliateAccountId);
  if (!campaignId || !affiliateAccountId) return bad("Campaign dan affiliate account wajib dipilih.");
  try {
    const [campaign, account] = await Promise.all([
      withTimeout(prisma.affiliateCampaign.findUnique({ where: { id: campaignId } })),
      withTimeout(prisma.affiliateAccount.findUnique({ where: { id: affiliateAccountId } }))
    ]);
    if (!campaign) return bad("Campaign tidak ditemukan.", 404);
    if (!account) return bad("Affiliate account tidak ditemukan.", 404);
    const socialAccount = await ensureSocialAccount(account);
    const views = integer(body.views);
    const likes = integer(body.likes);
    const comments = integer(body.comments);
    const shares = integer(body.shares);
    const saves = integer(body.saves);
    const clicks = integer(body.clicks);
    const sales = integer(body.sales);
    const snapshot = await withTimeout(prisma.platformPerformanceSnapshot.create({
      data: {
        campaignId,
        generatedContentId: generatedContentId || undefined,
        productName: campaign.productName,
        socialAccountId: socialAccount.id,
        platform: toSocialPlatform(account.platform),
        views,
        likes,
        comments,
        shares,
        saves,
        clicks,
        sales,
        commission: decimal(body.commission),
        engagementRate: views ? Number((((likes + comments + shares + saves) / views) * 100).toFixed(2)) : 0
      },
      include: { socialAccount: true }
    }));
    return NextResponse.json({ success: true, message: "Affiliate analytics saved.", snapshot }, { status: 201 });
  } catch (error) {
    serverLogger.error("affiliate.analytics.create_failed", error);
    return NextResponse.json({ success: false, message: "Analytics gagal disimpan ke Supabase." }, { status: 503 });
  }
}

async function ensureSocialAccount(account: { platform: string; accountName: string; handle: string; niche: string | null; notes: string }) {
  const platform = toSocialPlatform(account.platform);
  const existing = await prisma.socialAccount.findFirst({ where: { handle: account.handle, socialPlatform: platform } });
  if (existing) return existing;
  return prisma.socialAccount.create({ data: { name: account.accountName, handle: account.handle, niche: account.niche ?? "", notes: `Shadow account for affiliate analytics. ${account.notes ?? ""}`, platform: platform === "YOUTUBE_SHORTS" ? "YOUTUBE" : platform === "TIKTOK" ? "TIKTOK" : "INSTAGRAM", socialPlatform: platform, status: "MANUAL", authStatus: "NOT_CONNECTED", uploadMode: "MANUAL" } });
}
function toSocialPlatform(platform: string): SocialPlatform { const value = platform.toLowerCase(); if (value.includes("youtube")) return "YOUTUBE_SHORTS"; if (value.includes("instagram")) return "INSTAGRAM_REELS"; if (value.includes("facebook")) return "FACEBOOK_REELS"; return "TIKTOK"; }
function integer(value: unknown) { return Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0; }
function decimal(value: unknown) { return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bad(message: string, status = 400) { return NextResponse.json({ success: false, message }, { status }); }
