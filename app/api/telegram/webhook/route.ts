import { NextResponse } from "next/server";
import { approveFromTelegram, rejectFromTelegram, reviewFromTelegram } from "@/lib/telegram-service";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const callback = body.callback_query;
  const data = callback?.data as string | undefined;

  if (!data) return NextResponse.json({ ok: true, ignored: true });

  const [action, contentItemId] = data.split(":");
  try {
    if (action === "approve") {
      await approveFromTelegram(contentItemId, callback?.from?.username ? `@${callback.from.username}` : "Telegram Admin");
    }
    if (action === "reject") {
      await rejectFromTelegram(contentItemId, "Rejected via Telegram callback.", callback?.from?.username ? `@${callback.from.username}` : "Telegram Admin");
    }
    if (action === "review") {
      await reviewFromTelegram(contentItemId, callback?.from?.username ? `@${callback.from.username}` : "Telegram Admin");
    }
    await createNotification({ title: "Telegram approval updated", message: `Content ${action} diproses melalui Telegram.`, type: "TELEGRAM_APPROVAL_UPDATED", severity: action === "reject" ? "WARNING" : "SUCCESS", source: "Telegram", actionUrl: `/library/${contentItemId}` });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Telegram webhook failed." },
      { status: 500 }
    );
  }
}
