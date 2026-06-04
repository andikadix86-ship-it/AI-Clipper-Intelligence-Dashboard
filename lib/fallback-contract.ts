export type FallbackReason = "DATABASE_UNAVAILABLE" | "NOTIFICATION_UNAVAILABLE" | "PROVIDER_UNAVAILABLE" | "PROVIDER_NOT_CONFIGURED" | "EMPTY_RESULT";

export type EmptyStateContract = {
  title: string;
  description: string;
  action: { label: string; href: string };
};

export function createFallbackPayload<T extends Record<string, unknown>>(reason: FallbackReason, message: string, data: T, emptyState?: EmptyStateContract) {
  return {
    success: true,
    source: "fallback" as const,
    message,
    data,
    fallback: {
      active: true,
      reason,
      retryable: reason !== "EMPTY_RESULT"
    },
    emptyState,
    ...data
  };
}

export function createEmptyState(resource: string, href = "/dashboard"): EmptyStateContract {
  return {
    title: `${resource} belum tersedia`,
    description: `Belum ada data ${resource.toLowerCase()} yang dapat ditampilkan. Workspace tetap dapat digunakan dalam fallback mode.`,
    action: { label: "Kembali ke Dashboard", href }
  };
}
