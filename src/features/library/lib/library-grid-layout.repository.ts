import { db } from "@/lib/db";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkGridLayoutRecord,
  BookmarkGridLayouts,
  GridBreakpoint,
} from "../model/library-grid.types";
import type { Layout } from "react-grid-layout";
const GRID_LAYOUT_ID = "library-grid";

const GRID_COLS: Record<GridBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
};

const DEFAULT_SIZES: Record<
  GridBreakpoint,
  Pick<BookmarkGridItem, "w" | "h" | "minW" | "minH" | "maxW" | "maxH">
> = {
  lg: { w: 6, h: 9, minW: 4, minH: 8, maxW: 12, maxH: 18 },
  md: { w: 5, h: 9, minW: 4, minH: 8, maxW: 10, maxH: 18 },
  sm: { w: 3, h: 8, minW: 3, minH: 7, maxW: 6, maxH: 16 },
  xs: { w: 4, h: 7, minW: 2, minH: 6, maxW: 4, maxH: 14 },
};

function createDefaultItem(
  id: string,
  index: number,
  breakpoint: GridBreakpoint,
): BookmarkGridItem {
  const preset = DEFAULT_SIZES[breakpoint];
  const cols = GRID_COLS[breakpoint];
  const itemsPerRow = Math.max(1, Math.floor(cols / preset.w));

  return {
    i: id,
    x: (index % itemsPerRow) * preset.w,
    y: Math.floor(index / itemsPerRow) * preset.h,
    ...preset,
  };
}

function normalizeLayoutForBreakpoint(
  storedItems: Layout | undefined,
  bookmarks: BookmarkRecord[],
  breakpoint: GridBreakpoint,
): Layout {
  const storedById = new Map((storedItems ?? []).map((item) => [item.i, item]));

  return bookmarks.map((bookmark, index) => {
    return storedById.get(bookmark.id) ?? createDefaultItem(bookmark.id, index, breakpoint);
  });
}

export async function getLibraryGridLayouts(
  bookmarks: BookmarkRecord[],
): Promise<BookmarkGridLayouts> {
  const record = await db.libraryGridLayouts.get(GRID_LAYOUT_ID);
  const legacyItems = (record as { items?: BookmarkGridItem[] } | undefined)?.items;

  return {
    lg: normalizeLayoutForBreakpoint(
      record?.layouts?.lg ?? legacyItems,
      bookmarks,
      "lg",
    ),
    md: normalizeLayoutForBreakpoint(
      record?.layouts?.md ?? legacyItems,
      bookmarks,
      "md",
    ),
    sm: normalizeLayoutForBreakpoint(
      record?.layouts?.sm ?? legacyItems,
      bookmarks,
      "sm",
    ),
    xs: normalizeLayoutForBreakpoint(
      record?.layouts?.xs ?? legacyItems,
      bookmarks,
      "xs",
    ),
  };
}

export async function saveLibraryGridLayouts(
  layouts: BookmarkGridLayouts,
): Promise<BookmarkGridLayoutRecord> {
  const record: BookmarkGridLayoutRecord = {
    id: GRID_LAYOUT_ID,
    layouts: {
      lg: layouts.lg?.map((item) => ({ ...item })),
      md: layouts.md?.map((item) => ({ ...item })),
      sm: layouts.sm?.map((item) => ({ ...item })),
      xs: layouts.xs?.map((item) => ({ ...item })),
    },
    updatedAt: new Date().toISOString(),
  };

  await db.libraryGridLayouts.put(record);

  return record;
}

export async function resetLibraryGridLayouts() {
  await db.libraryGridLayouts.delete(GRID_LAYOUT_ID);
}