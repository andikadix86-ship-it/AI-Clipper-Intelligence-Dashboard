import { NextResponse } from "next/server";
import { setAssetStatus } from "@/lib/asset-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await setAssetStatus(params.id, "TRASHED");
    return NextResponse.json({ item: await getLibraryItem(params.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset could not be moved to trash." },
      { status: 500 }
    );
  }
}
