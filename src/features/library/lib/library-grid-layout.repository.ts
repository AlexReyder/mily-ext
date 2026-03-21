import { db } from "@/lib/db";
import type { Layout } from "react-grid-layout";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkGridLayoutRecord,
  BookmarkGridLayouts,
  BookmarkGridState,
  BookmarkViewportPreset,
  BookmarkViewportPresets,
  GridBreakpoint,
  LibraryGridLayoutScope,
} from "../model/library-grid.types";
import {
  getBookmarkViewportPreset,
  normalizeBookmarkLayoutItem,
  packDefaultBookmarkLayout,
  resolveBookmarkItemMetrics,
} from "./bookmark-layout-metrics";

const GRID_LAYOUT_IDS: Record<LibraryGridLayoutScope, string> = {
  grid: "library-grid-layout",
  creative: "library-creative-layout",
};

const VIEWPORT_PRESET_VALUES: BookmarkViewportPreset[] = [
  "mobile",
  "tablet",
  "desktop",
];

function getLayoutId(scope: LibraryGridLayoutScope) {
  return GRID_LAYOUT_IDS[scope];
}

function isValidViewportPreset(value: unknown): value is BookmarkViewportPreset {
  return (
    typeof value === "string" &&
    VIEWPORT_PRESET_VALUES.includes(value as BookmarkViewportPreset)
  );
}

function getLayoutBottom(items: Layout | undefined) {
  return (items ?? []).reduce((max, item) => {
    return Math.max(max, item.y + item.h);
  }, 0);
}

function createAppendedItem(
  bookmark: BookmarkRecord,
  breakpoint: GridBreakpoint,
  nextY: number,
  viewportPresets: BookmarkViewportPresets,
): BookmarkGridItem {
  const viewportPreset = getBookmarkViewportPreset(bookmark, viewportPresets);
  const metrics = resolveBookmarkItemMetrics(
    bookmark,
    breakpoint,
    viewportPreset,
  );

  return {
    i: bookmark.id,
    x: 0,
    y: nextY,
    ...metrics,
  };
}

function normalizeLayoutForBreakpoint(
  storedItems: Layout | undefined,
  bookmarks: BookmarkRecord[],
  breakpoint: GridBreakpoint,
  viewportPresets: BookmarkViewportPresets,
): Layout {
  const bookmarkIds = new Set(bookmarks.map((bookmark) => bookmark.id));

  const filteredStoredItems = (storedItems ?? []).filter((item) =>
    bookmarkIds.has(item.i),
  );

  if (!filteredStoredItems.length) {
    return packDefaultBookmarkLayout(bookmarks, breakpoint, viewportPresets);
  }

  const storedById = new Map(filteredStoredItems.map((item) => [item.i, item]));

  let nextY = getLayoutBottom(filteredStoredItems);
  const appendedById = new Map<string, BookmarkGridItem>();

  for (const bookmark of bookmarks) {
    if (storedById.has(bookmark.id)) {
      continue;
    }

    const appendedItem = createAppendedItem(
      bookmark,
      breakpoint,
      nextY,
      viewportPresets,
    );

    appendedById.set(bookmark.id, appendedItem);
    nextY += appendedItem.h;
  }

  return bookmarks.map((bookmark) => {
    const storedItem = storedById.get(bookmark.id);

    if (storedItem) {
      return normalizeBookmarkLayoutItem(
        bookmark,
        storedItem,
        breakpoint,
        getBookmarkViewportPreset(bookmark, viewportPresets),
      );
    }

    return appendedById.get(bookmark.id)!;
  });
}

function inferViewportPresetFromItem(
  item: Layout[number] | undefined,
  breakpoint: GridBreakpoint,
): BookmarkViewportPreset {
  if (!item) {
    return "desktop";
  }

  for (const preset of VIEWPORT_PRESET_VALUES) {
    const metrics = resolveBookmarkItemMetrics(
      {
        id: item.i,
        kind: "website",
        title: "",
        note: "",
        collectionId: "",
        tags: [],
        createdAt: "",
        updatedAt: "",
        content: { url: "" },
      },
      breakpoint,
      preset,
    );

    if (item.w === metrics.w && item.h === metrics.h) {
      return preset;
    }
  }

  return "desktop";
}

function inferViewportPreset(
  layouts: BookmarkGridLayouts,
  bookmarkId: string,
): BookmarkViewportPreset {
  const breakpoints: GridBreakpoint[] = ["lg", "md", "sm", "xs"];

  for (const breakpoint of breakpoints) {
    const item = layouts[breakpoint]?.find((layoutItem) => layoutItem.i === bookmarkId);

    if (item) {
      return inferViewportPresetFromItem(item, breakpoint);
    }
  }

  return "desktop";
}

function normalizeViewportPresets(
  storedViewportPresets: BookmarkViewportPresets | undefined,
  bookmarks: BookmarkRecord[],
  layouts: BookmarkGridLayouts,
): BookmarkViewportPresets {
  const nextViewportPresets: BookmarkViewportPresets = {};

  for (const bookmark of bookmarks) {
    if (bookmark.kind !== "website") {
      continue;
    }

    const storedPreset = storedViewportPresets?.[bookmark.id];

    nextViewportPresets[bookmark.id] = isValidViewportPreset(storedPreset)
      ? storedPreset
      : inferViewportPreset(layouts, bookmark.id);
  }

  return nextViewportPresets;
}

function cloneLayouts(layouts: BookmarkGridLayouts): BookmarkGridLayouts {
  return {
    lg: layouts.lg ? [...layouts.lg] : undefined,
    md: layouts.md ? [...layouts.md] : undefined,
    sm: layouts.sm ? [...layouts.sm] : undefined,
    xs: layouts.xs ? [...layouts.xs] : undefined,
  };
}

function cloneViewportPresets(
  viewportPresets: BookmarkViewportPresets,
): BookmarkViewportPresets {
  return { ...viewportPresets };
}

export async function getLibraryGridState(
  scope: LibraryGridLayoutScope,
  bookmarks: BookmarkRecord[],
): Promise<BookmarkGridState> {
  const record = await db.libraryGridLayouts.get(getLayoutId(scope));
  const legacyItems = (record as { items?: Layout } | undefined)?.items;
  const rawLayouts = record?.layouts;
  const rawViewportPresets = record?.viewportPresets ?? {};

  const layouts: BookmarkGridLayouts = {
    lg: normalizeLayoutForBreakpoint(
      rawLayouts?.lg ?? legacyItems,
      bookmarks,
      "lg",
      rawViewportPresets,
    ),
    md: normalizeLayoutForBreakpoint(
      rawLayouts?.md ?? legacyItems,
      bookmarks,
      "md",
      rawViewportPresets,
    ),
    sm: normalizeLayoutForBreakpoint(
      rawLayouts?.sm ?? legacyItems,
      bookmarks,
      "sm",
      rawViewportPresets,
    ),
    xs: normalizeLayoutForBreakpoint(
      rawLayouts?.xs ?? legacyItems,
      bookmarks,
      "xs",
      rawViewportPresets,
    ),
  };

  return {
    layouts,
    viewportPresets: normalizeViewportPresets(
      rawViewportPresets,
      bookmarks,
      layouts,
    ),
  };
}

export async function saveLibraryGridState(
  scope: LibraryGridLayoutScope,
  state: BookmarkGridState,
): Promise<BookmarkGridLayoutRecord> {
  const record: BookmarkGridLayoutRecord = {
    id: getLayoutId(scope),
    layouts: cloneLayouts(state.layouts),
    viewportPresets: cloneViewportPresets(state.viewportPresets),
    updatedAt: new Date().toISOString(),
  };

  await db.libraryGridLayouts.put(record);

  return record;
}

export async function resetLibraryGridLayouts(scope: LibraryGridLayoutScope) {
  await db.libraryGridLayouts.delete(getLayoutId(scope));
}
