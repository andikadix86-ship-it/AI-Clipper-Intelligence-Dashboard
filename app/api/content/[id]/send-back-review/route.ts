import { NextResponse } from "next/server";
import { transitionContentStatus } from "@/lib/approval-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  try {
    await transitionContentStatus(params.id, {
      toStatus: "REVIEW",
      note: body.note || "Sent back to review.",
      actionBy: body.actionBy
    });
    const item = await getLibraryItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content could not be sent back to review." },
      { status: 500 }
    );
  }
}
