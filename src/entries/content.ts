type CapturedImageContext = {
  srcUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  pageUrl?: string;
  pageTitle?: string;
};

type CapturedVideoContext = {
  srcUrl: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  filename?: string;
  pageUrl?: string;
  pageTitle?: string;
};

type GetLastImageContextMessage = {
  type: "mily:get-last-image-context";
  srcUrl?: string | null;
};

type GetLastVideoContextMessage = {
  type: "mily:get-last-video-context";
  srcUrl?: string | null;
};

function normalizeOptionalString(value: string | undefined | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeUrl(url: string | undefined | null) {
  const normalized = normalizeOptionalString(url);

  return normalized ?? null;
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

function getImageTarget(target: EventTarget | null) {
  if (target instanceof HTMLImageElement) {
    return target;
  }

  if (target instanceof Element) {
    return target.closest("img");
  }

  return null;
}

function getVideoTarget(target: EventTarget | null) {
  if (target instanceof HTMLVideoElement) {
    return target;
  }

  if (target instanceof Element) {
    return target.closest("video");
  }

  return null;
}

export default defineContentScript({
  matches: ["*://*/*"],
  main() {
    let lastImageContext: CapturedImageContext | null = null;
    let lastVideoContext: CapturedVideoContext | null = null;

    document.addEventListener(
      "contextmenu",
      (event) => {
        const image = getImageTarget(event.target);
        const video = getVideoTarget(event.target);

        if (image) {
          const srcUrl = normalizeOptionalString(image.currentSrc || image.src);

          if (srcUrl) {
            lastImageContext = {
              srcUrl,
              alt: normalizeOptionalString(image.alt),
              width: image.naturalWidth || undefined,
              height: image.naturalHeight || undefined,
              filename: normalizeOptionalString(extractFilenameFromUrl(srcUrl)),
              pageUrl: window.location.href,
              pageTitle: document.title || undefined,
            };
          }
        }

        if (video) {
          const srcUrl = normalizeOptionalString(video.currentSrc || video.src);

          if (srcUrl) {
            lastVideoContext = {
              srcUrl,
              posterUrl: normalizeOptionalString(video.poster),
              width: video.videoWidth || undefined,
              height: video.videoHeight || undefined,
              durationSec:
                Number.isFinite(video.duration) && video.duration > 0
                  ? Math.round(video.duration)
                  : undefined,
              filename: normalizeOptionalString(extractFilenameFromUrl(srcUrl)),
              pageUrl: window.location.href,
              pageTitle: document.title || undefined,
            };
          }
        }
      },
      true,
    );

    browser.runtime.onMessage.addListener(
      (message: GetLastImageContextMessage | GetLastVideoContextMessage) => {
        if (message?.type === "mily:get-last-image-context") {
          if (!lastImageContext) {
            return null;
          }

          const requestedSrcUrl = normalizeUrl(message.srcUrl);

          if (
            requestedSrcUrl &&
            requestedSrcUrl !== normalizeUrl(lastImageContext.srcUrl)
          ) {
            return {
              ...lastImageContext,
              srcUrl: requestedSrcUrl,
              filename:
                lastImageContext.filename ??
                normalizeOptionalString(extractFilenameFromUrl(requestedSrcUrl)),
            };
          }

          return lastImageContext;
        }

        if (message?.type === "mily:get-last-video-context") {
          if (!lastVideoContext) {
            return null;
          }

          const requestedSrcUrl = normalizeUrl(message.srcUrl);

          if (
            requestedSrcUrl &&
            requestedSrcUrl !== normalizeUrl(lastVideoContext.srcUrl)
          ) {
            return {
              ...lastVideoContext,
              srcUrl: requestedSrcUrl,
              filename:
                lastVideoContext.filename ??
                normalizeOptionalString(extractFilenameFromUrl(requestedSrcUrl)),
            };
          }

          return lastVideoContext;
        }
      },
    );
  },
});
