import { NextResponse } from "next/server";
import { mapPublishingItem } from "@/lib/publishing-service";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schedules = await prisma.postingSchedule.findMany({
      where: {
        status: { in: ["DRAFT", "SCHEDULED", "READY_TO_POST", "PUBLISHING", "POSTED", "FAILED"] },
        contentItem: { workflowStatus: { in: ["APPROVED", "SCHEDULED", "POSTED", "FAILED"] } }
      },
      orderBy: [{ scheduledAt: "asc" }, { startDate: "asc" }],
      include: {
        project: true,
        contentItem: { include: { generatedClip: true, creativeAsset: true } },
        socialAccount: true,
        analytics: { orderBy: { recordedAt: "desc" }, take: 1 },
        publishingChecklists: { take: 1, orderBy: { updatedAt: "desc" } },
        publishingJobs: { take: 1, orderBy: { updatedAt: "desc" } }
      }
    });

    return NextResponse.json({ items: schedules.map(mapPublishingItem) });
  } catch (error) {
    serverLogger.warn("publishing.queue.database_fallback", undefined, error);
    return NextResponse.json({ items: [], source: "fallback", message: "Database unavailable, using empty publishing queue." });
  }
}
