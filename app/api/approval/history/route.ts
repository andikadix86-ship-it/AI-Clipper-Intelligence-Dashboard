import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const contentItemId = url.searchParams.get("contentItemId") ?? undefined;
  try {
    const history = await prisma.approvalHistory.findMany({
      where: { contentItemId },
      orderBy: { createdAt: "desc" },
      include: { contentItem: { select: { title: true } } },
      take: 100
    });
    return NextResponse.json({
      history: history.map((item) => ({
        id: item.id,
        contentItemId: item.contentItemId,
        contentTitle: item.contentItem.title,
        fromStatus: item.fromStatus,
        toStatus: item.toStatus,
        note: item.note,
        reason: item.reason,
        actionBy: item.actionBy,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    serverLogger.warn("approval.history.database_fallback", undefined, error);
    return NextResponse.json({ history: [], source: "fallback", message: "Database unavailable, using empty approval history." });
  }
}
