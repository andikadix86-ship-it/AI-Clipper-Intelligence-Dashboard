import { NextResponse } from "next/server";
import { cancelPublishing } from "@/lib/publishing-job-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.postingScheduleId) return NextResponse.json({ error: "postingScheduleId is required." }, { status: 400 });
  try {
    const job = await cancelPublishing(body.postingScheduleId);
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publishing could not be canceled." }, { status: 500 });
  }
}
