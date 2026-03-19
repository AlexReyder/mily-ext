import { db } from "@/lib/db";
import type {
  BookmarkRecord,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@/features/bookmark/model/bookmark.types";

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export async function saveBookmark(
  input: CreateBookmarkInput,
): Promise<BookmarkRecord> {
  const normalizedUrl = input.url.trim();
  const now = new Date().toISOString();

  const existing = await db.bookmarks.where("url").equals(normalizedUrl).first();

  const record: BookmarkRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title.trim(),
    url: normalizedUrl,
    note: input.note.trim(),
    collectionId: input.collectionId.trim(),
    tags: normalizeTags(input.tags),
    faviconUrl: input.faviconUrl.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.bookmarks.put(record);

  return record;
}

export async function getBookmarks() {
  return db.bookmarks.orderBy("updatedAt").reverse().toArray();
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<BookmarkRecord> {
  const existing = await db.bookmarks.get(id);

  if (!existing) {
    throw new Error("Bookmark not found");
  }

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

  await db.bookmarks.bulkDelete(uniqueIds);

  return uniqueIds.length;
}