import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postingScheduleId = searchParams.get("postingScheduleId");
  if (!postingScheduleId) return NextResponse.json({ error: "postingScheduleId is required." }, { status: 400 });
  const job = await prisma.publishingJob.findFirst({
    where: { postingScheduleId },
    orderBy: { updatedAt: "desc" },
    include: { logs: { orderBy: { createdAt: "desc" }, take: 20 } }
  });
  return NextResponse.json({ job });
}
