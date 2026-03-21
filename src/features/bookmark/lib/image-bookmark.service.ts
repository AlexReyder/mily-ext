import { saveAsset } from "@/features/asset/lib/asset.repository";
import { createImagePreviewAndThumbnail } from "@/features/asset/lib/image-rendition.service";
import { saveImageBookmark } from "@/features/bookmark/lib/bookmark.repository";
import type { ImageBookmarkRecord } from "@/features/bookmark/model/bookmark.types";

export type CapturedImageContext = {
  srcUrl: string;
  alt?: string;
  width?: number;
  height?: number;
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

function buildImageTitle(context: CapturedImageContext) {
  const candidates = [
    normalizeOptionalString(context.alt),
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

  return "Saved image";
}

function guessMimeTypeFromUrl(url: string) {
  const lower = url.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".avif")) return "image/avif";

  return "application/octet-stream";
}

async function resolveImageDimensions(
  blob: Blob,
  fallbackWidth: number,
  fallbackHeight: number,
) {
  if (fallbackWidth > 0 && fallbackHeight > 0) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      const width = normalizePositiveNumber(bitmap.width);
      const height = normalizePositiveNumber(bitmap.height);

      bitmap.close?.();

      if (width > 0 && height > 0) {
        return { width, height };
      }
    } catch {
      // Ignore and fall back to provided metadata.
    }
  }

  return {
    width: fallbackWidth,
    height: fallbackHeight,
  };
}

async function fetchImageBlob(srcUrl: string) {
  const response = await fetch(srcUrl, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || guessMimeTypeFromUrl(srcUrl);

  if (!mimeType.startsWith("image/")) {
    throw new Error("The selected resource is not an image");
  }

  return new Blob([blob], { type: mimeType });
}

export async function saveImageBookmarkFromContext(
  context: CapturedImageContext,
): Promise<ImageBookmarkRecord> {
  const srcUrl = context.srcUrl.trim();

  if (!srcUrl) {
    throw new Error("Image source URL is required");
  }

  const fallbackWidth = normalizePositiveNumber(context.width);
  const fallbackHeight = normalizePositiveNumber(context.height);
  const blob = await fetchImageBlob(srcUrl);
  const { width, height } = await resolveImageDimensions(
    blob,
    fallbackWidth,
    fallbackHeight,
  );
  const mimeType = blob.type || guessMimeTypeFromUrl(srcUrl);
  const filename =
    normalizeOptionalString(context.filename) ??
    normalizeOptionalString(extractFilenameFromUrl(srcUrl));
  const { preview, thumbnail } = await createImagePreviewAndThumbnail(blob);

  const asset = await saveAsset({
    kind: "image",
    blob,
    mimeType,
    width,
    height,
    filename,
    sourceUrl: srcUrl,
  });

  const previewAsset = await saveAsset({
    kind: "image",
    blob: preview.blob,
    mimeType: preview.blob.type,
    width: preview.width,
    height: preview.height,
    filename,
    sourceUrl: srcUrl,
  });

  const thumbnailAsset = await saveAsset({
    kind: "thumbnail",
    blob: thumbnail.blob,
    mimeType: thumbnail.blob.type,
    width: thumbnail.width,
    height: thumbnail.height,
    filename,
    sourceUrl: srcUrl,
  });

  return saveImageBookmark({
    title: buildImageTitle(context),
    note: "",
    collectionId: "",
    tags: [],
    source: {
      savedFrom: "context-menu",
      pageUrl: normalizeOptionalString(context.pageUrl),
      pageTitle: normalizeOptionalString(context.pageTitle),
    },
    assetId: asset.id,
    previewAssetId: previewAsset.id,
    thumbnailAssetId: thumbnailAsset.id,
    originalUrl: srcUrl,
    mimeType,
    width,
    height,
    alt: normalizeOptionalString(context.alt),
    filename,
  });
}
