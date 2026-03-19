import { db } from "@/lib/db";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkGridLayoutRecord,
} from "../model/library-grid.types";

const GRID_LAYOUT_ID = "library-grid";
const DEFAULT_COLS = 12;
const DEFAULT_W = 6;
const DEFAULT_H = 9;

function createDefaultItem(id: string, index: number): BookmarkGridItem {
  const itemsPerRow = Math.max(1, Math.floor(DEFAULT_COLS / DEFAULT_W));

  return {
    i: id,
    x: (index % itemsPerRow) * DEFAULT_W,
    y: Math.floor(index / itemsPerRow) * DEFAULT_H,
    w: DEFAULT_W,
    h: DEFAULT_H,
    minW: 4,
    maxW: 12,
    minH: 8,
    maxH: 16,
  };
}

function normalizeLayout(
  storedItems: BookmarkGridItem[],
  bookmarks: BookmarkRecord[],
): BookmarkGridItem[] {
  const storedById = new Map(storedItems.map((item) => [item.i, item]));

  return bookmarks.map((bookmark, index) => {
    return storedById.get(bookmark.id) ?? createDefaultItem(bookmark.id, index);
  });
}

export async function getLibraryGridLayout(
  bookmarks: BookmarkRecord[],
): Promise<BookmarkGridItem[]> {
  const record = await db.libraryGridLayouts.get(GRID_LAYOUT_ID);

  return normalizeLayout(record?.items ?? [], bookmarks);
}

export async function saveLibraryGridLayout(
  items: BookmarkGridItem[],
): Promise<BookmarkGridLayoutRecord> {
  const record: BookmarkGridLayoutRecord = {
    id: GRID_LAYOUT_ID,
    items: items.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      maxW: item.maxW,
      minH: item.minH,
      maxH: item.maxH,
    })),
    updatedAt: new Date().toISOString(),
  };

  await db.libraryGridLayouts.put(record);

  return record;
}