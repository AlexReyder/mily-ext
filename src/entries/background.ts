import { saveImageBookmarkFromContext } from "@/features/bookmark/lib/image-bookmark.service";
import { saveVideoBookmarkFromContext } from "@/features/bookmark/lib/video-bookmark.service";

const SAVE_IMAGE_MENU_ID = "mily-save-image-to-library";
const SAVE_VIDEO_MENU_ID = "mily-save-video-to-library";

type CapturedImageContextMessage = {
  type: "mily:get-last-image-context";
  srcUrl?: string | null;
};

type CapturedVideoContextMessage = {
  type: "mily:get-last-video-context";
  srcUrl?: string | null;
};

type CapturedImageContextResponse = {
  srcUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  pageUrl?: string;
  pageTitle?: string;
};

type CapturedVideoContextResponse = {
  srcUrl: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  filename?: string;
  pageUrl?: string;
  pageTitle?: string;
};

async function setupContextMenus() {
  await browser.contextMenus.removeAll();

  browser.contextMenus.create({
    id: SAVE_IMAGE_MENU_ID,
    title: "Save image to Mily",
    contexts: ["image"],
  });

  browser.contextMenus.create({
    id: SAVE_VIDEO_MENU_ID,
    title: "Save video to Mily",
    contexts: ["video"],
  });
}

async function getCapturedImageContext(
  info: browser.contextMenus.OnClickData,
  tabId: number,
  srcUrl: string,
): Promise<CapturedImageContextResponse | null> {
  const message: CapturedImageContextMessage = {
    type: "mily:get-last-image-context",
    srcUrl,
  };

  try {
    if (typeof info.frameId === "number" && info.frameId >= 0) {
      return (await browser.tabs.sendMessage(tabId, message, {
        frameId: info.frameId,
      })) as CapturedImageContextResponse | null;
    }

    return (await browser.tabs.sendMessage(
      tabId,
      message,
    )) as CapturedImageContextResponse | null;
  } catch {
    return null;
  }
}

async function getCapturedVideoContext(
  info: browser.contextMenus.OnClickData,
  tabId: number,
  srcUrl: string,
): Promise<CapturedVideoContextResponse | null> {
  const message: CapturedVideoContextMessage = {
    type: "mily:get-last-video-context",
    srcUrl,
  };

  try {
    if (typeof info.frameId === "number" && info.frameId >= 0) {
      return (await browser.tabs.sendMessage(tabId, message, {
        frameId: info.frameId,
      })) as CapturedVideoContextResponse | null;
    }

    return (await browser.tabs.sendMessage(
      tabId,
      message,
    )) as CapturedVideoContextResponse | null;
  } catch {
    return null;
  }
}

async function handleSaveImageClick(
  info: browser.contextMenus.OnClickData,
  tab?: browser.tabs.Tab,
) {
  const srcUrl = typeof info.srcUrl === "string" ? info.srcUrl.trim() : "";

  if (!srcUrl) {
    return;
  }

  const tabId = tab?.id;
  const capturedContext =
    typeof tabId === "number"
      ? await getCapturedImageContext(info, tabId, srcUrl)
      : null;

  try {
    const bookmark = await saveImageBookmarkFromContext({
      srcUrl,
      alt: capturedContext?.alt,
      width: capturedContext?.width,
      height: capturedContext?.height,
      filename: capturedContext?.filename,
      pageUrl:
        capturedContext?.pageUrl ??
        (typeof info.pageUrl === "string" ? info.pageUrl : tab?.url),
      pageTitle: capturedContext?.pageTitle ?? tab?.title ?? undefined,
    });

    console.log("Saved image bookmark to Mily", {
      bookmarkId: bookmark.id,
      srcUrl,
    });
  } catch (error) {
    console.error("Failed to save image bookmark to Mily", {
      srcUrl,
      error,
    });
  }
}

async function handleSaveVideoClick(
  info: browser.contextMenus.OnClickData,
  tab?: browser.tabs.Tab,
) {
  const srcUrl = typeof info.srcUrl === "string" ? info.srcUrl.trim() : "";

  if (!srcUrl) {
    return;
  }

  const tabId = tab?.id;
  const capturedContext =
    typeof tabId === "number"
      ? await getCapturedVideoContext(info, tabId, srcUrl)
      : null;

  try {
    const bookmark = await saveVideoBookmarkFromContext({
      srcUrl,
      posterUrl: capturedContext?.posterUrl,
      width: capturedContext?.width,
      height: capturedContext?.height,
      durationSec: capturedContext?.durationSec,
      filename: capturedContext?.filename,
      pageUrl:
        capturedContext?.pageUrl ??
        (typeof info.pageUrl === "string" ? info.pageUrl : tab?.url),
      pageTitle: capturedContext?.pageTitle ?? tab?.title ?? undefined,
    });

    console.log("Saved video bookmark to Mily", {
      bookmarkId: bookmark.id,
      srcUrl,
    });
  } catch (error) {
    console.error("Failed to save video bookmark to Mily", {
      srcUrl,
      error,
    });
  }
}

export default defineBackground(() => {
  void setupContextMenus();

  browser.runtime.onInstalled.addListener(() => {
    void setupContextMenus();
  });

  browser.runtime.onStartup.addListener(() => {
    void setupContextMenus();
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === SAVE_IMAGE_MENU_ID) {
      void handleSaveImageClick(info, tab);
      return;
    }

    if (info.menuItemId === SAVE_VIDEO_MENU_ID) {
      void handleSaveVideoClick(info, tab);
    }
  });
});
