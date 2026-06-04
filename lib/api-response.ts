import { NextResponse } from "next/server";
import { createEmptyState, createFallbackPayload } from "@/lib/fallback-contract";
import type { FallbackReason } from "@/lib/fallback-contract";
import { sanitizeErrorMessage } from "@/lib/security";

type LegacyPayload = Record<string, unknown>;

export function apiSuccess(message: string, data?: unknown, legacy?: LegacyPayload, status = 200) {
  return NextResponse.json({ success: true, message, data, ...(legacy ?? {}) }, { status });
}

export function apiError(message: string, status = 500, error?: unknown, legacy?: LegacyPayload) {
  const sanitizedError = sanitizeErrorMessage(error ?? message);
  return NextResponse.json(
    {
      success: false,
      message,
      error: sanitizedError,
      errorDetails: {
        code: status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR",
        message: sanitizedError,
        retryable: status >= 500
      },
      ...(legacy ?? {})
    },
    { status }
  );
}

export function apiFallback(message: string, reason: FallbackReason, data: LegacyPayload, resource: string, status = 200) {
  return NextResponse.json(createFallbackPayload(reason, message, data, createEmptyState(resource)), { status });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
