import { manualPublishingProvider } from "@/lib/publishing/manual";
import type { PublishPostInput, PublishPostResult } from "@/lib/publishing/types";
import type { PublishingProvider } from "@/lib/publishing/types";
import { decodeSecret, encodeSecret, getGoogleOAuthRuntime } from "@/lib/google-oauth-service";
import { prisma } from "@/lib/prisma";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const maxUploadBytes = 512 * 1024 * 1024;

function resolveLocalVideoPath(videoFileUrl?: string) {
  if (!videoFileUrl) return "";
  if (videoFileUrl.startsWith("/uploads/")) return path.join(process.cwd(), "public", videoFileUrl);
  return "";
}

function friendlyYouTubeError(status: number, message: string) {
  const lower = message.toLowerCase();
  if (status === 401 || lower.includes("invalid_grant")) return "YouTube token expired or invalid. Reconnect YouTube.";
  if (status === 403 && lower.includes("quota")) return "YouTube quota exceeded. Try again after quota resets.";
  if (status === 400) return `YouTube rejected metadata: ${message}`;
  return message || "YouTube upload failed.";
}

async function refreshAccessToken(accountId: string) {
  const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
  if (!account?.refreshTokenEncrypted) throw new Error("Refresh token missing. Reconnect YouTube.");
  const runtime = await getGoogleOAuthRuntime();
  if (!runtime.configured) throw new Error("Google OAuth credentials are not configured.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: runtime.clientId,
      client_secret: runtime.clientSecret,
      refresh_token: decodeSecret(account.refreshTokenEncrypted),
      grant_type: "refresh_token"
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(friendlyYouTubeError(response.status, data.error_description ?? data.error ?? "Refresh token failed."));
  const expiresAt = new Date(Date.now() + Number(data.expires_in ?? 3600) * 1000);
  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessTokenEncrypted: encodeSecret(data.access_token),
      tokenExpiresAt: expiresAt,
      authStatus: "CONNECTED",
      lastSyncAt: new Date(),
      connectionNotes: "YouTube access token refreshed server-side."
    }
  });
  return data.access_token as string;
}

async function accessTokenFor(accountId: string) {
  const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
  if (!account?.accessTokenEncrypted) throw new Error("YouTube access token missing. Reconnect YouTube.");
  const expired = account.tokenExpiresAt ? account.tokenExpiresAt.getTime() <= Date.now() + 60_000 : true;
  if (expired) return refreshAccessToken(accountId);
  return decodeSecret(account.accessTokenEncrypted);
}

export async function uploadYouTubeShort(input: PublishPostInput): Promise<PublishPostResult> {
  if (!input.socialAccountId) return { ok: false, status: "FAILED", errorMessage: "socialAccountId is required." };
  if (!input.videoFileUrl) return { ok: false, status: "FAILED", errorMessage: "Video output file is required before YouTube upload." };
  const localPath = resolveLocalVideoPath(input.videoFileUrl);
  if (!localPath) return { ok: false, status: "FAILED", errorMessage: "Video file must be available in local server storage before upload." };

  let fileStat;
  try {
    fileStat = await stat(localPath);
  } catch {
    return { ok: false, status: "FAILED", errorMessage: "Video file not found on server storage." };
  }
  if (fileStat.size <= 0) return { ok: false, status: "FAILED", errorMessage: "Video file is empty." };
  if (fileStat.size > maxUploadBytes) return { ok: false, status: "FAILED", errorMessage: "Video file is too large for current server upload limit." };

  try {
    const accessToken = await accessTokenFor(input.socialAccountId);
    const description = `${input.description || input.caption || ""}`.includes("#Shorts")
      ? input.description || input.caption || ""
      : `${input.description || input.caption || ""}\n\n#Shorts`;
    const metadata = {
      snippet: {
        title: input.title.slice(0, 100),
        description,
        tags: input.tags ?? [],
        categoryId: "22"
      },
      status: {
        privacyStatus: input.privacyStatus ?? "private",
        selfDeclaredMadeForKids: Boolean(input.madeForKids)
      }
    };
    const params = new URLSearchParams({
      part: "snippet,status",
      uploadType: "resumable",
      notifySubscribers: String(Boolean(input.notifySubscribers))
    });
    const start = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(fileStat.size),
        "X-Upload-Content-Type": "video/mp4"
      },
      body: JSON.stringify(metadata)
    });
    const sessionUrl = start.headers.get("location");
    if (!start.ok || !sessionUrl) {
      const data = await start.json().catch(() => ({}));
      throw new Error(friendlyYouTubeError(start.status, data.error?.message ?? "Could not create YouTube upload session."));
    }

    const bytes = await readFile(localPath);
    const upload = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(fileStat.size),
        "Content-Type": "video/mp4"
      },
      body: bytes
    });
    const data = await upload.json().catch(() => ({}));
    if (!upload.ok || !data.id) throw new Error(friendlyYouTubeError(upload.status, data.error?.message ?? "YouTube upload failed."));
    const postUrl = `https://www.youtube.com/shorts/${data.id}`;
    return { ok: true, status: "POSTED", providerJobId: data.id, postUrl };
  } catch (error) {
    return { ok: false, status: "FAILED", errorMessage: error instanceof Error ? error.message : "YouTube upload failed." };
  }
}

export const youtubePublishingProvider: PublishingProvider = {
  ...manualPublishingProvider,
  name: "YouTube Shorts",
  async publishPost(input) {
    if (input.publishMode !== "AUTO" || input.account.authStatus !== "CONNECTED") {
      return { ok: true, status: "READY_TO_POST", warning: "YouTube real API disabled. Fallback to manual confirmation." };
    }
    return uploadYouTubeShort(input);
  },
  async validateAccount(accountId) {
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    const expired = account?.tokenExpiresAt ? account.tokenExpiresAt.getTime() < Date.now() : false;
    if (account?.accessTokenEncrypted && !expired) return { ok: true, authStatus: "CONNECTED", message: "YouTube token placeholder is valid." };
    return { ok: false, authStatus: expired ? "EXPIRED" : "NOT_CONNECTED", message: "YouTube OAuth is not connected or token is expired." };
  },
  async refreshToken(accountId) {
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account?.refreshTokenEncrypted) return { ok: false, authStatus: "NOT_CONNECTED", message: "Refresh token missing. Reconnect YouTube." };
    return { ok: true, authStatus: "CONNECTED", message: "Refresh token placeholder exists. Refresh endpoint can renew it server-side." };
  }
};
