import Dexie, { type EntityTable } from "dexie";
import type { AssetRecord } from "@/features/asset/model/asset.types";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type { BookmarkGridLayoutRecord } from "@/features/library/model/library-grid.types";

class MilyDb extends Dexie {
  bookmarks!: EntityTable<BookmarkRecord, "id">;
  libraryGridLayouts!: EntityTable<BookmarkGridLayoutRecord, "id">;
  assets!: EntityTable<AssetRecord, "id">;

  constructor() {
    super("mily-db");

    this.version(1).stores({
      bookmarks: "id, url, createdAt, updatedAt, collectionId, *tags",
    });

    this.version(2).stores({
      bookmarks: "id, url, createdAt, updatedAt, collectionId, *tags",
      libraryGridLayouts: "id, updatedAt",
    });

    this.version(3).stores({
      bookmarks: "id, kind, url, createdAt, updatedAt, collectionId, *tags",
      libraryGridLayouts: "id, updatedAt",
      assets: "id, kind, mimeType, createdAt, updatedAt",
    });

    this.version(4).stores({
      bookmarks: "id, kind, createdAt, updatedAt, collectionId, *tags",
      libraryGridLayouts: "id, updatedAt",
      assets: "id, kind, mimeType, createdAt, updatedAt",
    });
  }
}

export const db = new MilyDb();
