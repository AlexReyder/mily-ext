import { db } from "@/lib/db";
import type { Layout } from "react-grid-layout";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkGridLayoutRecord,
  BookmarkGridLayouts,
  GridBreakpoint,
  LibraryGridLayoutScope,
} from "../model/library-grid.types";

const GRID_LAYOUT_IDS: Record<LibraryGridLayoutScope, string> = {
  grid: "library-grid-layout",
  creative: "library-creative-layout",
};

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

function getLayoutId(scope: LibraryGridLayoutScope) {
  return GRID_LAYOUT_IDS[scope];
}

function createDefaultItem(
  id: string,
  index: number,
  breakpoint: GridBreakpoint,
  position?: Partial<Pick<BookmarkGridItem, "x" | "y">>,
): BookmarkGridItem {
  const preset = DEFAULT_SIZES[breakpoint];
  const cols = GRID_COLS[breakpoint];
  const itemsPerRow = Math.max(1, Math.floor(cols / preset.w));

  return {
    i: id,
    x: position?.x ?? (index % itemsPerRow) * preset.w,
    y: position?.y ?? Math.floor(index / itemsPerRow) * preset.h,
    ...preset,
  };
}

function getLayoutBottom(items: Layout | undefined) {
  return (items ?? []).reduce((max, item) => {
    return Math.max(max, item.y + item.h);
  }, 0);
}

function createAppendedItem(
  id: string,
  breakpoint: GridBreakpoint,
  nextY: number,
): BookmarkGridItem {
  return createDefaultItem(id, 0, breakpoint, {
    x: 0,
    y: nextY,
  });
}

function normalizeLayoutForBreakpoint(
  storedItems: Layout | undefined,
  bookmarks: BookmarkRecord[],
  breakpoint: GridBreakpoint,
): Layout {
  const bookmarkIds = new Set(bookmarks.map((bookmark) => bookmark.id));

  const filteredStoredItems = (storedItems ?? []).filter((item) =>
    bookmarkIds.has(item.i),
  );

  const storedById = new Map(filteredStoredItems.map((item) => [item.i, item]));

  if (!filteredStoredItems.length) {
    return bookmarks.map((bookmark, index) =>
      createDefaultItem(bookmark.id, index, breakpoint),
    );
  }

  let nextY = getLayoutBottom(filteredStoredItems);
  const appendedById = new Map<string, BookmarkGridItem>();

  for (const bookmark of bookmarks) {
    if (storedById.has(bookmark.id)) {
      continue;
    }

    const appendedItem = createAppendedItem(bookmark.id, breakpoint, nextY);

    appendedById.set(bookmark.id, appendedItem);
    nextY += appendedItem.h;
  }

  return bookmarks.map((bookmark) => {
    return storedById.get(bookmark.id) ?? appendedById.get(bookmark.id)!;
  });
}

export async function getLibraryGridLayouts(
  scope: LibraryGridLayoutScope,
  bookmarks: BookmarkRecord[],
): Promise<BookmarkGridLayouts> {
  const record = await db.libraryGridLayouts.get(getLayoutId(scope));
  const legacyItems = (record as { items?: Layout } | undefined)?.items;

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
  scope: LibraryGridLayoutScope,
  layouts: BookmarkGridLayouts,
): Promise<BookmarkGridLayoutRecord> {
  const record: BookmarkGridLayoutRecord = {
    id: getLayoutId(scope),
    layouts: {
      lg: layouts.lg ? [...layouts.lg] : undefined,
      md: layouts.md ? [...layouts.md] : undefined,
      sm: layouts.sm ? [...layouts.sm] : undefined,
      xs: layouts.xs ? [...layouts.xs] : undefined,
    },
    updatedAt: new Date().toISOString(),
  };

  await db.libraryGridLayouts.put(record);

  return record;
}

export async function resetLibraryGridLayouts(scope: LibraryGridLayoutScope) {
  await db.libraryGridLayouts.delete(getLayoutId(scope));
}