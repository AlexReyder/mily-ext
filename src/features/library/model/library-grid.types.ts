import type { Layout, LayoutItem } from "react-grid-layout";

export type GridBreakpoint = "lg" | "md" | "sm" | "xs";

export type BookmarkViewportPreset = "mobile" | "tablet" | "desktop";

export type LibraryGridLayoutScope = "grid" | "creative";

export type BookmarkGridItem = LayoutItem

export type BookmarkGridLayouts = Partial<
  Record<GridBreakpoint, Layout>
>;

export type BookmarkGridLayoutRecord = {
  id: string;
  layouts: BookmarkGridLayouts;
  updatedAt: string;
};