import { NextResponse } from "next/server";
import { publishingProviders } from "@/lib/publishing";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    providers: Object.entries(publishingProviders).map(([platform, provider]) => ({
      platform,
      name: provider.name,
      status: platform === "MANUAL_UPLOAD" ? "READY" : "DUMMY_READY",
      realApiEnabled: false
    }))
  });
}
