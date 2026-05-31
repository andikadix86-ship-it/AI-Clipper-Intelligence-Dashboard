import { NextResponse } from "next/server";
import { duplicateContentItem } from "@/lib/asset-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const duplicate = await duplicateContentItem(params.id);
    return NextResponse.json({ item: await getLibraryItem(duplicate.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset could not be duplicated." },
      { status: 500 }
    );
  }
}
