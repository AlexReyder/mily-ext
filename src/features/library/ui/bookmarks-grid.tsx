import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import ReactGridLayout, { useContainerWidth } from "react-grid-layout";

import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type { BookmarkGridItem } from "../model/library-grid.types";
import {
  getLibraryGridLayout,
  saveLibraryGridLayout,
} from "../lib/library-grid-layout.repository";
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
  const { width, containerRef, mounted } = useContainerWidth();
  const [layout, setLayout] = useState<BookmarkGridItem[]>([]);

  const bookmarkIdsKey = useMemo(
    () => data.map((item) => item.id).sort().join("|"),
    [data],
  );

  const layoutQuery = useQuery({
    queryKey: ["library-grid-layout", bookmarkIdsKey],
    queryFn: () => getLibraryGridLayout(data),
  });

  const saveLayoutMutation = useMutation({
    mutationFn: saveLibraryGridLayout,
  });

  useEffect(() => {
    if (layoutQuery.data) {
      setLayout(layoutQuery.data);
    }
  }, [layoutQuery.data]);

  useEffect(() => {
    if (!layout.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveLayoutMutation.mutateAsync(layout);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [layout, saveLayoutMutation]);

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
    <div ref={containerRef} className="w-full">
      {!mounted || !layout.length ? (
        <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
          Загружаем grid layout...
        </div>
      ) : (
        <ReactGridLayout
          width={width}
          layout={layout}
          onLayoutChange={(nextLayout) => {
            setLayout(nextLayout as BookmarkGridItem[]);
          }}
          gridConfig={{
            cols: 12,
            rowHeight: 56,
            margin: [16, 16],
            padding: [0, 0],
          }}
          dragConfig={{
            enabled: !isBulkDeleting,
            handle: ".bookmark-grid-drag-handle",
            cancel:
              ".bookmark-grid-no-drag,button,a,input,label,iframe,[data-no-drag='true']",
            bounded: true,
          }}
          resizeConfig={{
            enabled: !isBulkDeleting,
            handles: ["se"],
          }}
        >
          {data.map((bookmark) => (
            <div key={bookmark.id} className="h-full">
              <BookmarkLiveCard
                bookmark={bookmark}
                selected={Boolean(rowSelection[bookmark.id])}
                onToggleSelected={handleToggleSelected}
                onEdit={onEdit}
                isBulkDeleting={isBulkDeleting}
              />
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}