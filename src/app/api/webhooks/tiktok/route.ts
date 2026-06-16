import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "TikTok webhook endpoint",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    console.log("TikTok webhook event:", body);

    return NextResponse.json({
      ok: true,
      received: true,
    });
  } catch (error) {
    console.error("TikTok webhook error:", error);

    return NextResponse.json({
      ok: true,
      received: false,
    });
  }
}