import { saveAsset } from "@/features/asset/lib/asset.repository";
import { createImageRendition } from "@/features/asset/lib/image-rendition.service";
import { saveVideoBookmark } from "@/features/bookmark/lib/bookmark.repository";
import type { VideoBookmarkRecord } from "@/features/bookmark/model/bookmark.types";

export type CapturedVideoContext = {
  srcUrl: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  filename?: string;
  pageUrl?: string;
  pageTitle?: string;
};

function normalizeOptionalString(value: string | undefined | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function normalizePositiveNumber(value: number | undefined | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value);
}

function normalizeDuration(value: number | undefined | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.round(value);
}

function stripFileExtension(filename: string) {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

function extractFilenameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const rawFilename = pathname.split("/").pop();

    return rawFilename ? decodeURIComponent(rawFilename) : undefined;
  } catch {
    return undefined;
  }
}

function buildVideoTitle(context: CapturedVideoContext) {
  const candidates = [
    normalizeOptionalString(context.filename),
    normalizeOptionalString(extractFilenameFromUrl(context.srcUrl)),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = stripFileExtension(candidate).trim();

    if (normalized) {
      return normalized;
    }
  }

  return "Saved video";
}

function guessVideoMimeTypeFromUrl(url: string) {
  const lower = url.toLowerCase();

  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/x-m4v";

  return "application/octet-stream";
}

async function fetchBlob(srcUrl: string) {
  const response = await fetch(srcUrl, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch resource: ${response.status}`);
  }

  return response.blob();
}

async function fetchVideoBlob(srcUrl: string) {
  const blob = await fetchBlob(srcUrl);
  const mimeType = blob.type || guessVideoMimeTypeFromUrl(srcUrl);

  if (!mimeType.startsWith("video/")) {
    throw new Error("The selected resource is not a video");
  }

  return new Blob([blob], { type: mimeType });
}

async function tryCreatePosterAsset(
  posterUrl: string | undefined,
  filename: string | undefined,
) {
  const normalizedPosterUrl = normalizeOptionalString(posterUrl);

  if (!normalizedPosterUrl) {
    return null;
  }

  try {
    const posterBlob = await fetchBlob(normalizedPosterUrl);

    if (!posterBlob.type.startsWith("image/")) {
      return null;
    }

    const rendition = await createImageRendition(posterBlob, {
      maxWidth: 1280,
      maxHeight: 1280,
      mimeType: "image/webp",
      quality: 0.88,
    });

    return saveAsset({
      kind: "thumbnail",
      blob: rendition.blob,
      mimeType: rendition.blob.type,
      width: rendition.width,
      height: rendition.height,
      filename,
      sourceUrl: normalizedPosterUrl,
    });
  } catch {
    return null;
  }
}

export async function saveVideoBookmarkFromContext(
  context: CapturedVideoContext,
): Promise<VideoBookmarkRecord> {
  const srcUrl = context.srcUrl.trim();

  if (!srcUrl) {
    throw new Error("Video source URL is required");
  }

  const width = normalizePositiveNumber(context.width);
  const height = normalizePositiveNumber(context.height);
  const durationSec = normalizeDuration(context.durationSec);
  const blob = await fetchVideoBlob(srcUrl);
  const mimeType = blob.type || guessVideoMimeTypeFromUrl(srcUrl);
  const filename =
    normalizeOptionalString(context.filename) ??
    normalizeOptionalString(extractFilenameFromUrl(srcUrl));

  const asset = await saveAsset({
    kind: "video",
    blob,
    mimeType,
    width: width || undefined,
    height: height || undefined,
    durationSec,
    filename,
    sourceUrl: srcUrl,
  });

  const posterAsset = await tryCreatePosterAsset(context.posterUrl, filename);

  return saveVideoBookmark({
    title: buildVideoTitle(context),
    note: "",
    collectionId: "",
    tags: [],
    source: {
      savedFrom: "context-menu",
      pageUrl: normalizeOptionalString(context.pageUrl),
      pageTitle: normalizeOptionalString(context.pageTitle),
    },
    assetId: asset.id,
    posterAssetId: posterAsset?.id,
    originalUrl: srcUrl,
    posterUrl: normalizeOptionalString(context.posterUrl),
    mimeType,
    width,
    height,
    durationSec,
    filename,
  });
}
