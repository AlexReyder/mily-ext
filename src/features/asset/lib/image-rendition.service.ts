type ImageRenditionOptions = {
  maxWidth: number;
  maxHeight: number;
  mimeType?: string;
  quality?: number;
};

type ImageRenditionResult = {
  blob: Blob;
  width: number;
  height: number;
};

function normalizePositiveNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return Math.max(1, Math.round(value));
}

function resolveOutputMimeType(sourceMimeType: string, preferredMimeType?: string) {
  const candidate = preferredMimeType?.trim() || sourceMimeType.trim();

  if (
    candidate === "image/jpeg" ||
    candidate === "image/png" ||
    candidate === "image/webp"
  ) {
    return candidate;
  }

  return "image/webp";
}

function calculateRenditionSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const safeWidth = normalizePositiveNumber(width);
  const safeHeight = normalizePositiveNumber(height);
  const widthRatio = maxWidth / safeWidth;
  const heightRatio = maxHeight / safeHeight;
  const ratio = Math.min(1, widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(safeWidth * ratio)),
    height: Math.max(1, Math.round(safeHeight * ratio)),
  };
}

export async function createImageRendition(
  sourceBlob: Blob,
  options: ImageRenditionOptions,
): Promise<ImageRenditionResult> {
  const bitmap = await createImageBitmap(sourceBlob);

  try {
    const { width, height } = calculateRenditionSize(
      bitmap.width,
      bitmap.height,
      options.maxWidth,
      options.maxHeight,
    );

    if (width === bitmap.width && height === bitmap.height) {
      return {
        blob: sourceBlob,
        width,
        height,
      };
    }

    if (typeof OffscreenCanvas === "undefined") {
      return {
        blob: sourceBlob,
        width: bitmap.width,
        height: bitmap.height,
      };
    }

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!context) {
      return {
        blob: sourceBlob,
        width: bitmap.width,
        height: bitmap.height,
      };
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const mimeType = resolveOutputMimeType(sourceBlob.type, options.mimeType);
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: options.quality,
    });

    return {
      blob,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}

export async function createImagePreviewAndThumbnail(sourceBlob: Blob) {
  const preview = await createImageRendition(sourceBlob, {
    maxWidth: 1440,
    maxHeight: 1440,
    mimeType: "image/webp",
    quality: 0.9,
  });

  const thumbnail = await createImageRendition(sourceBlob, {
    maxWidth: 480,
    maxHeight: 480,
    mimeType: "image/webp",
    quality: 0.82,
  });

  return {
    preview,
    thumbnail,
  };
}
