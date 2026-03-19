export type BookmarkRecord = {
  id: string;
  title: string;
  url: string;
  note: string;
  collectionId: string;
  tags: string[];
  faviconUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookmarkInput = Omit<
  BookmarkRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateBookmarkInput = Pick<BookmarkRecord, "title" | "tags">;