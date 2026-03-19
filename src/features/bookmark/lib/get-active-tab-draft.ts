export type ActiveTabDraft = {
  title: string;
  url: string;
  faviconUrl: string;
  unsupported: boolean;
};

const HTTP_URL_RE = /^https?:\/\//i;

export async function getActiveTabDraft(): Promise<ActiveTabDraft | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!tab) return null;
  const url = tab.url ?? "";
  return {
    title: tab.title ?? "",
    url,
    faviconUrl: tab.favIconUrl ?? "",
    unsupported: !HTTP_URL_RE.test(url),
  };
}