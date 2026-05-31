import { NextResponse } from "next/server";
import { rejectFromTelegram } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.contentItemId) return NextResponse.json({ error: "contentItemId is required." }, { status: 400 });

  try {
    return NextResponse.json({ log: await rejectFromTelegram(body.contentItemId, body.reason ?? "Rejected via Telegram.", body.responseBy ?? "Telegram Admin") });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Telegram rejection could not be applied." },
      { status: 500 }
    );
  }
}
