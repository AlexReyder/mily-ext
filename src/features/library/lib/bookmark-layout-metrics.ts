import type { Layout } from "react-grid-layout";

import {
  getBookmarkIntrinsicAspectRatio,
  isWebsiteBookmark,
  type BookmarkRecord,
} from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkViewportPreset,
  BookmarkViewportPresets,
  GridBreakpoint,
} from "../model/library-grid.types";

export const GRID_COLS: Record<GridBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
};

const GRID_UNIT_ASPECT: Record<GridBreakpoint, number> = {
  lg: 1.48,
  md: 1.38,
  sm: 1.18,
  xs: 0.94,
};

const DEFAULT_WEBSITE_ITEM_SIZES: Record<
  BookmarkViewportPreset,
  Record<GridBreakpoint, Pick<BookmarkGridItem, "w" | "h" | "minW" | "minH">>
> = {
  mobile: {
    lg: { w: 4, h: 11, minW: 4, minH: 8 },
    md: { w: 4, h: 10, minW: 4, minH: 8 },
    sm: { w: 3, h: 9, minW: 3, minH: 7 },
    xs: { w: 2, h: 8, minW: 2, minH: 7 },
  },
  tablet: {
    lg: { w: 6, h: 10, minW: 5, minH: 8 },
    md: { w: 6, h: 9, minW: 5, minH: 8 },
    sm: { w: 4, h: 8, minW: 4, minH: 7 },
    xs: { w: 4, h: 7, minW: 4, minH: 6 },
  },
  desktop: {
    lg: { w: 8, h: 10, minW: 6, minH: 8 },
    md: { w: 8, h: 9, minW: 6, minH: 8 },
    sm: { w: 6, h: 8, minW: 6, minH: 7 },
    xs: { w: 4, h: 7, minW: 4, minH: 6 },
  },
};

const MEDIA_DEFAULT_WIDTHS = {
  portrait: {
    lg: 4,
    md: 4,
    sm: 3,
    xs: 2,
  },
  square: {
    lg: 5,
    md: 4,
    sm: 3,
    xs: 2,
  },
  landscape: {
    lg: 6,
    md: 5,
    sm: 4,
    xs: 4,
  },
  ultrawide: {
    lg: 7,
    md: 6,
    sm: 5,
    xs: 4,
  },
} as const;

const MEDIA_MIN_WIDTHS: Record<GridBreakpoint, number> = {
  lg: 2,
  md: 2,
  sm: 2,
  xs: 2,
};

const MEDIA_MAX_HEIGHT: Record<GridBreakpoint, number> = {
  lg: 24,
  md: 24,
  sm: 20,
  xs: 18,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getBookmarkAspectBucket(bookmark: BookmarkRecord) {
  const ratio = getBookmarkIntrinsicAspectRatio(bookmark);

  if (!ratio) {
    return "landscape" as const;
  }

  if (ratio < 0.8) {
    return "portrait" as const;
  }

  if (ratio <= 1.2) {
    return "square" as const;
  }

  if (ratio <= 1.9) {
    return "landscape" as const;
  }

  return "ultrawide" as const;
}

function getEffectiveAspectRatio(bookmark: BookmarkRecord) {
  return getBookmarkIntrinsicAspectRatio(bookmark) ?? 16 / 10;
}

function clampItemWidth(width: number, breakpoint: GridBreakpoint) {
  return clamp(Math.round(width), 1, GRID_COLS[breakpoint]);
}

function calculateMediaHeightFromWidth(
  width: number,
  breakpoint: GridBreakpoint,
  aspectRatio: number,
) {
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
  const estimatedHeight = Math.round(
    (width * GRID_UNIT_ASPECT[breakpoint]) / safeAspectRatio,
  );

  return Math.max(3, estimatedHeight);
}

function getDefaultMediaWidth(
  bookmark: BookmarkRecord,
  breakpoint: GridBreakpoint,
): number {
  const bucket = getBookmarkAspectBucket(bookmark);
  return MEDIA_DEFAULT_WIDTHS[bucket][breakpoint];
}

export function getBookmarkViewportPreset(
  bookmark: BookmarkRecord,
  viewportPresets: BookmarkViewportPresets,
): BookmarkViewportPreset {
  if (!isWebsiteBookmark(bookmark)) {
    return "desktop";
  }

  return viewportPresets[bookmark.id] ?? "desktop";
}

export function resolveBookmarkItemMetrics(
  bookmark: BookmarkRecord,
  breakpoint: GridBreakpoint,
  viewportPreset: BookmarkViewportPreset,
  widthOverride?: number,
): Pick<BookmarkGridItem, "w" | "h" | "minW" | "minH" | "maxW" | "maxH"> {
  if (isWebsiteBookmark(bookmark)) {
    const config = DEFAULT_WEBSITE_ITEM_SIZES[viewportPreset][breakpoint];

    return {
      ...config,
      maxW: GRID_COLS[breakpoint],
      maxH: MEDIA_MAX_HEIGHT[breakpoint],
    };
  }

  const aspectRatio = getEffectiveAspectRatio(bookmark);
  const minW = MEDIA_MIN_WIDTHS[breakpoint];
  const requestedWidth = widthOverride ?? getDefaultMediaWidth(bookmark, breakpoint);
  const w = clampItemWidth(
    Math.max(minW, requestedWidth),
    breakpoint,
  );
  const h = calculateMediaHeightFromWidth(w, breakpoint, aspectRatio);
  const minH = calculateMediaHeightFromWidth(minW, breakpoint, aspectRatio);
  const maxW = GRID_COLS[breakpoint];
  const maxH = Math.min(
    MEDIA_MAX_HEIGHT[breakpoint],
    calculateMediaHeightFromWidth(maxW, breakpoint, aspectRatio),
  );

  return {
    w,
    h: clamp(h, minH, Math.max(minH, maxH)),
    minW,
    minH,
    maxW,
    maxH: Math.max(minH, maxH),
  };
}

export function normalizeBookmarkLayoutItem(
  bookmark: BookmarkRecord,
  item: Layout[number],
  breakpoint: GridBreakpoint,
  viewportPreset: BookmarkViewportPreset,
): BookmarkGridItem {
  if (isWebsiteBookmark(bookmark)) {
    const websiteMetrics = resolveBookmarkItemMetrics(
      bookmark,
      breakpoint,
      viewportPreset,
    );
    const nextW = clampItemWidth(item.w, breakpoint);
    const maxX = Math.max(0, GRID_COLS[breakpoint] - nextW);

    return {
      ...item,
      x: clamp(item.x, 0, maxX),
      w: nextW,
      h: Math.max(item.h, websiteMetrics.minH),
      minW: websiteMetrics.minW,
      minH: websiteMetrics.minH,
      maxW: websiteMetrics.maxW,
      maxH: websiteMetrics.maxH,
    };
  }

  const mediaMetrics = resolveBookmarkItemMetrics(
    bookmark,
    breakpoint,
    viewportPreset,
    item.w,
  );
  const maxX = Math.max(0, GRID_COLS[breakpoint] - mediaMetrics.w);

  return {
    ...item,
    x: clamp(item.x, 0, maxX),
    w: mediaMetrics.w,
    h: mediaMetrics.h,
    minW: mediaMetrics.minW,
    minH: mediaMetrics.minH,
    maxW: mediaMetrics.maxW,
    maxH: mediaMetrics.maxH,
  };
}

export function packDefaultBookmarkLayout(
  bookmarks: BookmarkRecord[],
  breakpoint: GridBreakpoint,
  viewportPresets: BookmarkViewportPresets,
): Layout {
  const cols = GRID_COLS[breakpoint];
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  return bookmarks.map((bookmark) => {
    const viewportPreset = getBookmarkViewportPreset(bookmark, viewportPresets);
    const metrics = resolveBookmarkItemMetrics(
      bookmark,
      breakpoint,
      viewportPreset,
    );

    if (currentX + metrics.w > cols) {
      currentX = 0;
      currentY += rowHeight;
      rowHeight = 0;
    }

    const item: BookmarkGridItem = {
      i: bookmark.id,
      x: currentX,
      y: currentY,
      ...metrics,
    };

    currentX += metrics.w;
    rowHeight = Math.max(rowHeight, metrics.h);

    return item;
  });
}
