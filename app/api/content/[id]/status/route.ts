import { NextResponse } from "next/server";
import { getLibraryItem } from "@/lib/library-service";
import { transitionContentStatus } from "@/lib/approval-service";
import type { ContentStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: { status: ContentStatus; note?: string; reason?: string; actionBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.status) return NextResponse.json({ error: "Status is required." }, { status: 400 });

  try {
    await transitionContentStatus(params.id, {
      toStatus: body.status,
      note: body.note,
      reason: body.reason,
      actionBy: body.actionBy
    });
    const item = await getLibraryItem(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content status could not be updated." },
      { status: 500 }
    );
  }
}
