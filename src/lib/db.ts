import Dexie, { type EntityTable } from "dexie";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type { BookmarkGridLayoutRecord } from "@/features/library/model/library-grid.types";

class MilyDb extends Dexie {
  bookmarks!: EntityTable<BookmarkRecord, "id">;
  libraryGridLayouts!: EntityTable<BookmarkGridLayoutRecord, "id">;

  constructor() {
    super("mily-db");

    this.version(1).stores({
      bookmarks: "id, url, createdAt, updatedAt, collectionId, *tags",
    });
    
     this.version(2).stores({
      bookmarks: "id, url, createdAt, updatedAt, collectionId, *tags",
      libraryGridLayouts: "id, updatedAt",
    });

  }
}

export const db = new MilyDb();