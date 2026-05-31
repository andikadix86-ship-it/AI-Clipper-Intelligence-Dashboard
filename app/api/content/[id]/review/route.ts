import { NextResponse } from "next/server";
import { transitionContentStatus } from "@/lib/approval-service";
import { getLibraryItem } from "@/lib/library-service";
import { sendTelegramApproval } from "@/lib/telegram-service";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  try {
    await transitionContentStatus(params.id, { toStatus: "REVIEW", note: body.note, actionBy: body.actionBy });
    const telegram = await sendTelegramApproval(params.id, "SENT_REVIEW").catch((telegramError) => ({
      status: "FAILED",
      errorMessage: telegramError instanceof Error ? telegramError.message : "Telegram approval failed."
    }));
    const item = await getLibraryItem(params.id);
    await createNotification({ title: "Content waiting approval", message: `${item?.title ?? "Content"} membutuhkan keputusan admin.`, type: "CONTENT_WAITING_APPROVAL", severity: "WARNING", source: "Approval Queue", actionUrl: "/approval" });
    return NextResponse.json({ item, telegram, warning: telegram.status === "FAILED" ? telegram.errorMessage : undefined });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content could not be sent to review." },
      { status: 500 }
    );
  }
}
