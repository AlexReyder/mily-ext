import { deleteAssetsByIds } from "@/features/asset/lib/asset.repository";
import { db } from "@/lib/db";
import type {
  BookmarkRecord,
  BookmarkSourceMeta,
  CreateBookmarkInput,
  CreateImageBookmarkInput,
  CreateVideoBookmarkInput,
  ImageBookmarkRecord,
  LegacyWebsiteBookmarkRecord,
  UpdateBookmarkInput,
  VideoBookmarkRecord,
  WebsiteBookmarkRecord,
} from "@/features/bookmark/model/bookmark.types";

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function normalizeSource(source: BookmarkSourceMeta | undefined) {
  if (!source) {
    return undefined;
  }

  const normalized: BookmarkSourceMeta = {
    savedFrom: source.savedFrom,
    pageUrl: source.pageUrl?.trim() || undefined,
    pageTitle: source.pageTitle?.trim() || undefined,
  };

  return normalized.pageUrl || normalized.pageTitle || normalized.savedFrom
    ? normalized
    : undefined;
}

function normalizeLegacyWebsiteRecord(
  record: LegacyWebsiteBookmarkRecord,
): WebsiteBookmarkRecord {
  return {
    id: record.id,
    kind: "website",
    title: record.title.trim(),
    note: record.note.trim(),
    collectionId: record.collectionId.trim(),
    tags: normalizeTags(record.tags),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    content: {
      url: record.url.trim(),
      faviconUrl: record.faviconUrl.trim() || undefined,
    },
  };
}

function normalizeWebsiteBookmarkRecord(
  record: WebsiteBookmarkRecord,
): WebsiteBookmarkRecord {
  return {
    ...record,
    title: record.title.trim(),
    note: record.note.trim(),
    collectionId: record.collectionId.trim(),
    tags: normalizeTags(record.tags),
    source: normalizeSource(record.source),
    content: {
      url: record.content.url.trim(),
      faviconUrl: record.content.faviconUrl?.trim() || undefined,
    },
  };
}

function normalizeImageBookmarkRecord(
  record: ImageBookmarkRecord,
): ImageBookmarkRecord {
  return {
    ...record,
    title: record.title.trim(),
    note: record.note.trim(),
    collectionId: record.collectionId.trim(),
    tags: normalizeTags(record.tags),
    source: normalizeSource(record.source),
    content: {
      ...record.content,
      assetId: record.content.assetId?.trim() || undefined,
      previewAssetId: record.content.previewAssetId?.trim() || undefined,
      thumbnailAssetId: record.content.thumbnailAssetId?.trim() || undefined,
      originalUrl: record.content.originalUrl?.trim() || undefined,
      previewUrl: record.content.previewUrl?.trim() || undefined,
      thumbnailUrl: record.content.thumbnailUrl?.trim() || undefined,
      alt: record.content.alt?.trim() || undefined,
      filename: record.content.filename?.trim() || undefined,
      mimeType: record.content.mimeType.trim(),
    },
  };
}

function normalizeVideoBookmarkRecord(
  record: VideoBookmarkRecord,
): VideoBookmarkRecord {
  return {
    ...record,
    title: record.title.trim(),
    note: record.note.trim(),
    collectionId: record.collectionId.trim(),
    tags: normalizeTags(record.tags),
    source: normalizeSource(record.source),
    content: {
      ...record.content,
      assetId: record.content.assetId?.trim() || undefined,
      posterAssetId: record.content.posterAssetId?.trim() || undefined,
      originalUrl: record.content.originalUrl?.trim() || undefined,
      posterUrl: record.content.posterUrl?.trim() || undefined,
      mimeType: record.content.mimeType?.trim() || undefined,
      filename: record.content.filename?.trim() || undefined,
    },
  };
}

type StoredBookmarkRecord = BookmarkRecord | LegacyWebsiteBookmarkRecord;

export function normalizeStoredBookmarkRecord(
  record: StoredBookmarkRecord,
): BookmarkRecord {
  if ("kind" in record) {
    switch (record.kind) {
      case "website":
        return normalizeWebsiteBookmarkRecord(record);

      case "image":
        return normalizeImageBookmarkRecord(record);

      case "video":
        return normalizeVideoBookmarkRecord(record);
    }
  }

  return normalizeLegacyWebsiteRecord(record);
}

async function getStoredBookmarks() {
  return ((await db.bookmarks.toArray()) as unknown as StoredBookmarkRecord[]) ?? [];
}

export async function saveBookmark(
  input: CreateBookmarkInput,
): Promise<WebsiteBookmarkRecord> {
  const normalizedUrl = input.url.trim();
  const now = new Date().toISOString();

  const existing = (await getStoredBookmarks())
    .map(normalizeStoredBookmarkRecord)
    .find(
      (bookmark): bookmark is WebsiteBookmarkRecord =>
        bookmark.kind === "website" && bookmark.content.url === normalizedUrl,
    );

  const record: WebsiteBookmarkRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    kind: "website",
    title: input.title.trim(),
    note: input.note.trim(),
    collectionId: input.collectionId.trim(),
    tags: normalizeTags(input.tags),
    source: normalizeSource(input.source),
    content: {
      url: normalizedUrl,
      faviconUrl: input.faviconUrl.trim() || undefined,
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.bookmarks.put(record as BookmarkRecord);

  return record;
}

export async function saveImageBookmark(
  input: CreateImageBookmarkInput,
): Promise<ImageBookmarkRecord> {
  const normalizedOriginalUrl = input.originalUrl?.trim() || undefined;
  const normalizedAssetId = input.assetId?.trim() || undefined;
  const now = new Date().toISOString();

  const existing = (await getStoredBookmarks())
    .map(normalizeStoredBookmarkRecord)
    .find((bookmark): bookmark is ImageBookmarkRecord => {
      if (bookmark.kind !== "image") {
        return false;
      }

      if (
        normalizedOriginalUrl &&
        bookmark.content.originalUrl === normalizedOriginalUrl
      ) {
        return true;
      }

      if (normalizedAssetId && bookmark.content.assetId === normalizedAssetId) {
        return true;
      }

      return false;
    });

  const record: ImageBookmarkRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    kind: "image",
    title: input.title.trim(),
    note: input.note.trim(),
    collectionId: input.collectionId.trim(),
    tags: normalizeTags(input.tags),
    source: normalizeSource(input.source),
    content: {
      assetId: normalizedAssetId,
      previewAssetId: input.previewAssetId?.trim() || undefined,
      thumbnailAssetId: input.thumbnailAssetId?.trim() || undefined,
      originalUrl: normalizedOriginalUrl,
      previewUrl: input.previewUrl?.trim() || undefined,
      thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
      mimeType: input.mimeType.trim(),
      width: input.width,
      height: input.height,
      alt: input.alt?.trim() || undefined,
      filename: input.filename?.trim() || undefined,
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.bookmarks.put(record as BookmarkRecord);

  return record;
}

export async function saveVideoBookmark(
  input: CreateVideoBookmarkInput,
): Promise<VideoBookmarkRecord> {
  const normalizedOriginalUrl = input.originalUrl?.trim() || undefined;
  const normalizedAssetId = input.assetId?.trim() || undefined;
  const now = new Date().toISOString();

  const existing = (await getStoredBookmarks())
    .map(normalizeStoredBookmarkRecord)
    .find((bookmark): bookmark is VideoBookmarkRecord => {
      if (bookmark.kind !== "video") {
        return false;
      }

      if (
        normalizedOriginalUrl &&
        bookmark.content.originalUrl === normalizedOriginalUrl
      ) {
        return true;
      }

      if (normalizedAssetId && bookmark.content.assetId === normalizedAssetId) {
        return true;
      }

      return false;
    });

  const record: VideoBookmarkRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    kind: "video",
    title: input.title.trim(),
    note: input.note.trim(),
    collectionId: input.collectionId.trim(),
    tags: normalizeTags(input.tags),
    source: normalizeSource(input.source),
    content: {
      assetId: normalizedAssetId,
      posterAssetId: input.posterAssetId?.trim() || undefined,
      originalUrl: normalizedOriginalUrl,
      posterUrl: input.posterUrl?.trim() || undefined,
      mimeType: input.mimeType?.trim() || undefined,
      width: input.width,
      height: input.height,
      durationSec: input.durationSec,
      filename: input.filename?.trim() || undefined,
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.bookmarks.put(record as BookmarkRecord);

  return record;
}

export async function getBookmarks(): Promise<BookmarkRecord[]> {
  const records =
    ((await db.bookmarks.orderBy("updatedAt").reverse().toArray()) as unknown as StoredBookmarkRecord[]) ??
    [];

  return records.map(normalizeStoredBookmarkRecord);
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<BookmarkRecord> {
  const existingRaw = (await db.bookmarks.get(id)) as
    | StoredBookmarkRecord
    | undefined;

  if (!existingRaw) {
    throw new Error("Bookmark not found");
  }

  const existing = normalizeStoredBookmarkRecord(existingRaw);
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required");
  }

  const updatedRecord: BookmarkRecord = {
    ...existing,
    title,
    tags: normalizeTags(input.tags),
    updatedAt: new Date().toISOString(),
  };

  await db.bookmarks.put(updatedRecord);

  return updatedRecord;
}

export async function deleteBookmarksByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return 0;
  }

  const storedRecords = ((await db.bookmarks.bulkGet(uniqueIds)) as unknown as (
    | StoredBookmarkRecord
    | undefined
  )[]) ?? [];

  const assetIds = storedRecords.flatMap((record) => {
    if (!record) {
      return [];
    }

    const bookmark = normalizeStoredBookmarkRecord(record);

    if (bookmark.kind === "image") {
      return [
        bookmark.content.assetId,
        bookmark.content.previewAssetId,
        bookmark.content.thumbnailAssetId,
      ].filter(Boolean) as string[];
    }

    if (bookmark.kind === "video") {
      return [bookmark.content.assetId, bookmark.content.posterAssetId].filter(
        Boolean,
      ) as string[];
    }

    return [];
  });

  await db.bookmarks.bulkDelete(uniqueIds);

  if (assetIds.length) {
    await deleteAssetsByIds(assetIds);
  }

  return uniqueIds.length;
}
