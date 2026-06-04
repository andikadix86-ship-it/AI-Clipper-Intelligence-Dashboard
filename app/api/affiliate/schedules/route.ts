import { NextResponse } from "next/server";
import type { Platform, SocialPlatform } from "@prisma/client";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const schedules = await withTimeout(prisma.postingSchedule.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { socialAccount: true } }));
    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    serverLogger.error("affiliate.schedule.list_failed", error);
    return NextResponse.json({ success: false, message: "Schedule data belum dapat dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return bad("Invalid JSON body."); }
  const generatedContentId = text(body.generatedContentId);
  const affiliateAccountId = text(body.affiliateAccountId);
  const date = text(body.date);
  const time = text(body.time);
  const status = text(body.status) || "SCHEDULED";
  if (!generatedContentId || !affiliateAccountId || !date || !time) return bad("Generated content, affiliate account, date, dan time wajib diisi.");
  try {
    const [content, affiliateAccount] = await Promise.all([
      withTimeout(prisma.generatedContent.findUnique({ where: { id: generatedContentId }, include: { campaign: true } })),
      withTimeout(prisma.affiliateAccount.findUnique({ where: { id: affiliateAccountId } }))
    ]);
    if (!content) return bad("Generated content tidak ditemukan.", 404);
    if (!affiliateAccount) return bad("Affiliate account tidak ditemukan.", 404);
    const socialAccount = await ensureSocialAccount(affiliateAccount);
    const socialPlatform = toSocialPlatform(affiliateAccount.platform);
    const schedule = await withTimeout(prisma.postingSchedule.create({
      data: {
        socialAccountId: socialAccount.id,
        destination: toDestination(socialPlatform),
        socialPlatform,
        startDate: new Date(`${date}T00:00:00.000Z`),
        scheduledAt: new Date(`${date}T${time}:00.000Z`),
        postingTime: time,
        postingEndTime: time,
        timezone: "Asia/Jakarta",
        videosPerDay: 1,
        publishMode: "MANUAL",
        status: scheduleStatus(status),
        notes: JSON.stringify({ source: "affiliate-center", generatedContentId, campaignId: content.campaignId, affiliateAccountId, title: content.title, contentType: content.contentType })
      },
      include: { socialAccount: true }
    }));
    return NextResponse.json({ success: true, message: "Manual posting schedule saved.", schedule }, { status: 201 });
  } catch (error) {
    serverLogger.error("affiliate.schedule.create_failed", error);
    return NextResponse.json({ success: false, message: "Schedule gagal disimpan ke Supabase." }, { status: 503 });
  }
}

async function ensureSocialAccount(account: { platform: string; accountName: string; handle: string; niche: string | null; notes: string }) {
  const platform = toSocialPlatform(account.platform);
  const existing = await prisma.socialAccount.findFirst({ where: { handle: account.handle, socialPlatform: platform } });
  if (existing) return existing;
  return prisma.socialAccount.create({ data: { name: account.accountName, handle: account.handle, niche: account.niche ?? "", notes: `Shadow account for affiliate scheduler. ${account.notes ?? ""}`, platform: toDestination(platform), socialPlatform: platform, status: "MANUAL", authStatus: "NOT_CONNECTED", uploadMode: "MANUAL" } });
}
function toSocialPlatform(platform: string): SocialPlatform {
  const value = platform.toLowerCase();
  if (value.includes("youtube")) return "YOUTUBE_SHORTS";
  if (value.includes("instagram")) return "INSTAGRAM_REELS";
  if (value.includes("facebook")) return "FACEBOOK_REELS";
  return "TIKTOK";
}
function toDestination(platform: SocialPlatform): Platform { return platform === "YOUTUBE_SHORTS" ? "YOUTUBE" : platform === "TIKTOK" ? "TIKTOK" : "INSTAGRAM"; }
function scheduleStatus(value: string) { return value === "DRAFT" || value === "POSTED" || value === "FAILED" ? value : "SCHEDULED"; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bad(message: string, status = 400) { return NextResponse.json({ success: false, message }, { status }); }
