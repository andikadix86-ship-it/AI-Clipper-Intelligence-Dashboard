import type { PublishingProvider } from "@/lib/publishing/types";

export const manualPublishingProvider: PublishingProvider = {
  name: "Manual Upload",
  async publishPost() {
    return {
      ok: true,
      status: "READY_TO_POST",
      warning: "Manual mode prepared. Admin must upload the asset manually before marking as posted."
    };
  },
  async validateAccount() {
    return { ok: true, authStatus: "NOT_CONNECTED", message: "Manual upload does not require API connection." };
  },
  async refreshToken() {
    return { ok: true, authStatus: "NOT_CONNECTED", message: "Manual upload has no token to refresh." };
  },
  async getPostStatus() {
    return { status: "READY_TO_POST", message: "Manual upload waits for admin confirmation." };
  }
};
