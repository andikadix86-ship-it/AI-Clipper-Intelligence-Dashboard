import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const collections = await prisma.assetCollection.findMany({
      orderBy: { updatedAt: "desc" },
      include: { project: true, _count: { select: { items: true } } }
    });

    return NextResponse.json({
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        projectId: collection.projectId ?? undefined,
        project: collection.project?.name ?? "Unassigned",
        contentCount: collection._count.items,
        createdAt: collection.createdAt.toISOString()
      }))
    });
  } catch (error) {
    serverLogger.warn("library.collections.database_fallback", undefined, error);
    return NextResponse.json({ collections: [], source: "fallback", message: "Database unavailable, using empty collection list." });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Collection name is required." }, { status: 400 });

  try {
    const collection = await prisma.assetCollection.create({
      data: {
        name: body.name,
        description: body.description ?? "",
        projectId: body.projectId || undefined
      },
      include: { project: true, _count: { select: { items: true } } }
    });

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        projectId: collection.projectId ?? undefined,
        project: collection.project?.name ?? "Unassigned",
        contentCount: collection._count.items,
        createdAt: collection.createdAt.toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Collection could not be saved." },
      { status: 500 }
    );
  }
}
