import { NextResponse } from "next/server";
import { sanitizeErrorMessage } from "@/lib/security";

type LegacyPayload = Record<string, unknown>;

export function apiSuccess(message: string, data?: unknown, legacy?: LegacyPayload, status = 200) {
  return NextResponse.json({ success: true, message, data, ...(legacy ?? {}) }, { status });
}

export function apiError(message: string, status = 500, error?: unknown, legacy?: LegacyPayload) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: sanitizeErrorMessage(error ?? message),
      ...(legacy ?? {})
    },
    { status }
  );
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
