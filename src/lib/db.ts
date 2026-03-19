import Dexie, { type EntityTable } from "dexie";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";

class MilyDb extends Dexie {
  bookmarks!: EntityTable<BookmarkRecord, "id">;

  constructor() {
    super("mily-db");

    this.version(1).stores({
      bookmarks: "id, url, createdAt, updatedAt, collectionId, *tags",
    });
  }
}

export const db = new MilyDb();