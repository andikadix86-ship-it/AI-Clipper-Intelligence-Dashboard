import { manualPublishingProvider } from "@/lib/publishing/manual";
import type { PublishingProvider } from "@/lib/publishing/types";
import { prisma } from "@/lib/prisma";

export const facebookPublishingProvider: PublishingProvider = {
  ...manualPublishingProvider,
  name: "Facebook Reels",
  async publishPost(input) {
    if (input.publishMode !== "AUTO" || input.account.authStatus !== "CONNECTED") {
      return { ok: true, status: "READY_TO_POST", warning: "Facebook real API disabled. Fallback to manual confirmation." };
    }
    return { ok: true, status: "PUBLISHING", providerJobId: `fb_dummy_${Date.now()}`, warning: "Facebook adapter is prepared but real upload is disabled in this phase." };
  },
  async validateAccount(accountId) {
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    const expired = account?.tokenExpiresAt ? account.tokenExpiresAt.getTime() < Date.now() : false;
    if (account?.accessTokenEncrypted && !expired) return { ok: true, authStatus: "CONNECTED", message: "Facebook/Meta token placeholder is valid." };
    return { ok: false, authStatus: expired ? "EXPIRED" : "NOT_CONNECTED", message: "Facebook/Meta OAuth is not connected or token is expired." };
  },
  async refreshToken(accountId) {
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account?.refreshTokenEncrypted) return { ok: false, authStatus: "NOT_CONNECTED", message: "Refresh token missing. Reconnect Meta." };
    return { ok: true, authStatus: "CONNECTED", message: "Meta refresh token placeholder exists." };
  }
};
