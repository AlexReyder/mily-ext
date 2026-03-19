import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import { BookmarkLiveCard } from "./bookmark-live-card";

type BookmarksGridProps = {
  data: BookmarkRecord[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
};

export function BookmarksGrid({
  data,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  isBulkDeleting = false,
}: BookmarksGridProps) {
  const handleToggleSelected = (bookmarkId: string, checked: boolean) => {
    onRowSelectionChange((prev) => {
      const next = { ...prev };

      if (checked) {
        next[bookmarkId] = true;
      } else {
        delete next[bookmarkId];
      }

      return next;
    });
  };

  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
        Bookmark пока нет
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.map((bookmark) => (
        <BookmarkLiveCard
          key={bookmark.id}
          bookmark={bookmark}
          selected={Boolean(rowSelection[bookmark.id])}
          onToggleSelected={handleToggleSelected}
          onEdit={onEdit}
          isBulkDeleting={isBulkDeleting}
        />
      ))}
    </div>
  );
}