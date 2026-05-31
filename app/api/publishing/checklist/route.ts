import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ChecklistRequest = {
  contentItemId: string;
  postingScheduleId?: string;
  assetChecked?: boolean;
  captionCopied?: boolean;
  hashtagCopied?: boolean;
  uploadedManually?: boolean;
  postUrlAdded?: boolean;
};

export async function POST(request: Request) {
  let body: ChecklistRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.contentItemId) {
    return NextResponse.json({ error: "Content item is required." }, { status: 400 });
  }

  try {
    const existing = body.postingScheduleId
      ? await prisma.publishingChecklist.findFirst({ where: { postingScheduleId: body.postingScheduleId } })
      : await prisma.publishingChecklist.findFirst({ where: { contentItemId: body.contentItemId, postingScheduleId: null } });

    const data = {
      contentItemId: body.contentItemId,
      postingScheduleId: body.postingScheduleId || undefined,
      assetChecked: Boolean(body.assetChecked),
      captionCopied: Boolean(body.captionCopied),
      hashtagCopied: Boolean(body.hashtagCopied),
      uploadedManually: Boolean(body.uploadedManually),
      postUrlAdded: Boolean(body.postUrlAdded)
    };

    const checklist = existing
      ? await prisma.publishingChecklist.update({ where: { id: existing.id }, data })
      : await prisma.publishingChecklist.create({ data });

    return NextResponse.json({ checklist });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checklist could not be saved." },
      { status: 500 }
    );
  }
}
