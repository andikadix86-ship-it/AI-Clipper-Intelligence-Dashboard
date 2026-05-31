import { NextResponse } from "next/server";
import { bulkUpdateAssets } from "@/lib/asset-service";
import type { ContentStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.ids?.length || !body.action) {
    return NextResponse.json({ error: "Asset selection and action are required." }, { status: 400 });
  }

  try {
    const result = await bulkUpdateAssets({
      ids: body.ids,
      action: body.action,
      workflowStatus: body.workflowStatus as ContentStatus | undefined,
      projectId: body.projectId
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk action could not be completed." },
      { status: 500 }
    );
  }
}
