const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska"
]);

const allowedVideoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv"]);

export function validateVideoUpload(file: Pick<File, "name" | "size" | "type">) {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (!allowedVideoTypes.has(file.type) || !allowedVideoExtensions.has(extension)) {
    return {
      valid: false as const,
      error: "Format video tidak didukung. Gunakan MP4, MOV, WebM, atau MKV."
    };
  }

  if (file.size <= 0) {
    return { valid: false as const, error: "File video kosong atau tidak dapat dibaca." };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { valid: false as const, error: "Ukuran video melebihi batas 500 MB." };
  }

  return { valid: true as const };
}

export const videoUploadPolicy = {
  acceptedExtensions: ".mp4,.mov,.webm,.mkv",
  maxSizeBytes: MAX_VIDEO_SIZE_BYTES
};
