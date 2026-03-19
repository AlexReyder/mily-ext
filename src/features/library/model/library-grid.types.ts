import type { Layout, LayoutItem } from "react-grid-layout";

export type GridBreakpoint = "lg" | "md" | "sm" | "xs";

export type BookmarkViewportPreset = "mobile" | "tablet" | "desktop";

export type BookmarkGridItem = LayoutItem
// export type BookmarkGridItem = {
//   i: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   minW?: number;
//   maxW?: number;
//   minH?: number;
//   maxH?: number;
// };

export type BookmarkGridLayouts = Partial<
  Record<GridBreakpoint, Layout>
>;

export type BookmarkGridLayoutRecord = {
  id: string;
  layouts: BookmarkGridLayouts;
  updatedAt: string;
};