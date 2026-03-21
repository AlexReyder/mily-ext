export type BookmarkKind = "website" | "image" | "video";

export type BookmarkSavedFrom = "manual" | "context-menu" | "import";

export type BookmarkSourceMeta = {
  savedFrom?: BookmarkSavedFrom;
  pageUrl?: string;
  pageTitle?: string;
};

type BookmarkBase = {
  id: string;
  kind: BookmarkKind;
  title: string;
  note: string;
  collectionId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source?: BookmarkSourceMeta;
};

export type WebsiteBookmarkRecord = BookmarkBase & {
  kind: "website";
  content: {
    url: string;
    faviconUrl?: string;
  };
};

export type ImageBookmarkRecord = BookmarkBase & {
  kind: "image";
  content: {
    assetId?: string;
    originalUrl?: string;
    previewUrl?: string;
    thumbnailUrl?: string;
    mimeType: string;
    width: number;
    height: number;
    alt?: string;
    filename?: string;
  };
};

export type VideoBookmarkRecord = BookmarkBase & {
  kind: "video";
  content: {
    assetId?: string;
    originalUrl?: string;
    posterUrl?: string;
    mimeType?: string;
    width: number;
    height: number;
    durationSec?: number;
  };
};

export type BookmarkRecord =
  | WebsiteBookmarkRecord
  | ImageBookmarkRecord
  | VideoBookmarkRecord;

export type LegacyWebsiteBookmarkRecord = {
  id: string;
  title: string;
  url: string;
  note: string;
  collectionId: string;
  tags: string[];
  faviconUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWebsiteBookmarkInput = {
  title: string;
  url: string;
  note: string;
  collectionId: string;
  tags: string[];
  faviconUrl: string;
  source?: BookmarkSourceMeta;
};

export type CreateBookmarkInput = CreateWebsiteBookmarkInput;

export type UpdateBookmarkInput = Pick<BookmarkBase, "title" | "tags">;

function trimOptional(value: string | undefined | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isWebsiteBookmark(
  bookmark: BookmarkRecord,
): bookmark is WebsiteBookmarkRecord {
  return bookmark.kind === "website";
}

export function isImageBookmark(
  bookmark: BookmarkRecord,
): bookmark is ImageBookmarkRecord {
  return bookmark.kind === "image";
}

export function isVideoBookmark(
  bookmark: BookmarkRecord,
): bookmark is VideoBookmarkRecord {
  return bookmark.kind === "video";
}

export function getBookmarkOpenUrl(bookmark: BookmarkRecord): string | null {
  switch (bookmark.kind) {
    case "website":
      return trimOptional(bookmark.content.url);

    case "image":
      return (
        trimOptional(bookmark.content.originalUrl) ??
        trimOptional(bookmark.source?.pageUrl)
      );

    case "video":
      return (
        trimOptional(bookmark.content.originalUrl) ??
        trimOptional(bookmark.source?.pageUrl)
      );
  }
}

export function getBookmarkMediaUrl(bookmark: BookmarkRecord): string | null {
  switch (bookmark.kind) {
    case "website":
      return trimOptional(bookmark.content.url);

    case "image":
      return (
        trimOptional(bookmark.content.previewUrl) ??
        trimOptional(bookmark.content.originalUrl)
      );

    case "video":
      return trimOptional(bookmark.content.originalUrl);
  }
}

export function getBookmarkThumbnailUrl(bookmark: BookmarkRecord): string | null {
  switch (bookmark.kind) {
    case "website":
      return trimOptional(bookmark.content.faviconUrl);

    case "image":
      return (
        trimOptional(bookmark.content.thumbnailUrl) ??
        trimOptional(bookmark.content.previewUrl) ??
        trimOptional(bookmark.content.originalUrl)
      );

    case "video":
      return trimOptional(bookmark.content.posterUrl);
  }
}

export function getBookmarkFaviconUrl(bookmark: BookmarkRecord): string | null {
  return bookmark.kind === "website"
    ? trimOptional(bookmark.content.faviconUrl)
    : null;
}

export function getBookmarkKindLabel(bookmark: BookmarkRecord) {
  switch (bookmark.kind) {
    case "website":
      return "Website";

    case "image":
      return "Image";

    case "video":
      return "Video";
  }
}

export function getBookmarkSecondaryText(bookmark: BookmarkRecord) {
  switch (bookmark.kind) {
    case "website": {
      const url = trimOptional(bookmark.content.url);

      return url ? getHostname(url) : "Website";
    }

    case "image": {
      const { width, height } = bookmark.content;

      if (width > 0 && height > 0) {
        return `${width}×${height}`;
      }

      return getBookmarkKindLabel(bookmark);
    }

    case "video": {
      const { width, height } = bookmark.content;

      if (width > 0 && height > 0) {
        return `${width}×${height}`;
      }

      return getBookmarkKindLabel(bookmark);
    }
  }
}

export function getBookmarkSearchValues(bookmark: BookmarkRecord) {
  const common = [
    bookmark.title,
    bookmark.note,
    bookmark.collectionId,
    ...bookmark.tags,
    bookmark.source?.pageTitle ?? "",
    bookmark.source?.pageUrl ?? "",
    getBookmarkOpenUrl(bookmark) ?? "",
  ];

  switch (bookmark.kind) {
    case "website":
      return [...common, bookmark.content.url, bookmark.content.faviconUrl ?? ""];

    case "image":
      return [
        ...common,
        bookmark.content.originalUrl ?? "",
        bookmark.content.filename ?? "",
        bookmark.content.alt ?? "",
        bookmark.content.mimeType,
      ];

    case "video":
      return [
        ...common,
        bookmark.content.originalUrl ?? "",
        bookmark.content.posterUrl ?? "",
        bookmark.content.mimeType ?? "",
      ];
  }
}

export function getBookmarkIntrinsicAspectRatio(
  bookmark: BookmarkRecord,
): number | null {
  if (bookmark.kind === "website") {
    return null;
  }

  const { width, height } = bookmark.content;

  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}
