import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/observability/system-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSystemHealth());
}
