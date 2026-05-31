import { NextResponse } from "next/server";
import { createAssetVersion } from "@/lib/asset-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  try {
    const version = await createAssetVersion(params.id, body.versionNotes);
    return NextResponse.json({ item: await getLibraryItem(version.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "New version could not be created." },
      { status: 500 }
    );
  }
}
