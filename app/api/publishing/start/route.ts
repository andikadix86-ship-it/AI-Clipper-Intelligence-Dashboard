import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { startPublishing } from "@/lib/publishing-job-service";
import type { PublishMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.postingScheduleId) return apiError("postingScheduleId is required.", 400);
  try {
    const job = await startPublishing(body.postingScheduleId, body.publishMode as PublishMode | undefined);
    await writeAuditLog({
      action: "PUBLISHING_ATTEMPT",
      entityType: "PublishingJob",
      entityId: job.id,
      message: "Dummy publishing job started.",
      metadata: { postingScheduleId: body.postingScheduleId, publishMode: body.publishMode }
    });
    return apiSuccess("Publishing job started.", { job }, { job });
  } catch (error) {
    return apiError("Publishing could not be started.", 500, error);
  }
}
