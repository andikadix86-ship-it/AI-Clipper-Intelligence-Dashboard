import { NextResponse } from "next/server";
import { transitionContentStatus } from "@/lib/approval-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  if (!body.reason) return NextResponse.json({ error: "Reject reason is required." }, { status: 400 });

  try {
    await transitionContentStatus(params.id, {
      toStatus: "REJECTED",
      note: body.note,
      reason: body.reason,
      actionBy: body.actionBy
    });
    const item = await getLibraryItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content could not be rejected." },
      { status: 500 }
    );
  }
}
