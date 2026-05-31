import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { dummyProjects } from "@/lib/dummy-creative";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import type { ContentMode } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await withTimeout(prisma.project.findMany({ orderBy: { updatedAt: "desc" } }), 4000);
    const data = projects.length ? projects : dummyProjects;
    return apiSuccess("Projects loaded.", { projects: data }, { projects: data });
  } catch {
    return apiSuccess("Projects loaded from dummy fallback.", { projects: dummyProjects }, { projects: dummyProjects });
  }
}

export async function POST(request: Request) {
  let body: {
    name: string;
    niche: string;
    category: string;
    targetAccounts: string[];
    contentMode: ContentMode;
  };

  body = (await parseJsonBody<typeof body>(request)) as typeof body;
  if (!body) return apiError("Invalid JSON body.", 400);

  if (!body.name || !body.niche || !body.category) {
    return apiError("Project name, niche, and category are required.", 400);
  }

  try {
    const project = await withTimeout(
      prisma.project.create({
        data: {
          name: body.name,
          niche: body.niche,
          category: body.category,
          targetAccounts: body.targetAccounts ?? [],
          contentMode: body.contentMode
        }
      }),
      5000
    );

    await writeAuditLog({
      action: "CREATE_PROJECT",
      entityType: "Project",
      entityId: project.id,
      message: `Project created: ${project.name}`,
      metadata: { niche: project.niche, category: project.category, contentMode: project.contentMode }
    });

    return apiSuccess("Project created.", { project }, { project });
  } catch (error) {
    return apiError("Project could not be saved to Supabase.", 500, error);
  }
}
