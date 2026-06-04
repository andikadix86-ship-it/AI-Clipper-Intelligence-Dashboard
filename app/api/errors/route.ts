import { NextResponse } from "next/server";
import { listErrorEvents } from "@/lib/observability/error-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ success: true, errors: listErrorEvents() });
}
