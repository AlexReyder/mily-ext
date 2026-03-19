export type BookmarkGridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
};

export type BookmarkGridLayoutRecord = {
  id: string;
  items: BookmarkGridItem[];
  updatedAt: string;
};