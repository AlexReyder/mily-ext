import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";

import {
  deleteBookmarksByIds,
  getBookmarks,
  updateBookmark,
} from "@/features/bookmark/lib/bookmark.repository";
import { EditBookmarkSheet } from "@/features/bookmark/ui/edit-bookmark-sheet";
import type {
  BookmarkRecord,
  UpdateBookmarkInput,
} from "@/features/bookmark/model/bookmark.types";
import { getBookmarkSearchValues } from "@/features/bookmark/model/bookmark.types";
import { useLibraryViewStore } from "../model/library-view.store";
import { BookmarksTable } from "./bookmarks-table";
import { LibraryToolbar } from "./library-toolbar";
import { BookmarksGrid } from "./bookmarks-grid";
import { BookmarksLargeIcons } from "./bookmarks-large-icons";
import { BookmarksFullscreen } from "./bookmarks-fullscreen";

export function LibraryPage() {
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingBookmark, setEditingBookmark] = useState<BookmarkRecord | null>(
    null,
  );
  const [gridResetNonce, setGridResetNonce] = useState(0);
  const [creativeResetNonce, setCreativeResetNonce] = useState(0);

  const viewMode = useLibraryViewStore((state) => state.viewMode);
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
  });

  const filteredData = useMemo(() => {
    const items = bookmarksQuery.data ?? [];
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => {
      return getBookmarkSearchValues(item).some((value) =>
        value.toLowerCase().includes(q),
      );
    });
  }, [bookmarksQuery.data, search]);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  useEffect(() => {
    const existingIds = new Set((bookmarksQuery.data ?? []).map((item) => item.id));

    setRowSelection((prev) => {
      let changed = false;
      const next: RowSelectionState = {};

      for (const [id, selected] of Object.entries(prev)) {
        if (selected && existingIds.has(id)) {
          next[id] = true;
        } else {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [bookmarksQuery.data]);

  const deleteSelectedMutation = useMutation({
    mutationFn: deleteBookmarksByIds,
    onSuccess: async (_, deletedIds) => {
      setRowSelection((prev) => {
        const next = { ...prev };

        for (const id of deletedIds) {
          delete next[id];
        }

        return next;
      });

      await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: ({
      bookmarkId,
      input,
    }: {
      bookmarkId: string;
      input: UpdateBookmarkInput;
    }) => updateBookmark(bookmarkId, input),
    onSuccess: async () => {
      setEditingBookmark(null);
      await queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const handleSelectAllFiltered = () => {
    if (!filteredData.length) return;

    const nextEntries = Object.fromEntries(
      filteredData.map((item) => [item.id, true]),
    );

    setRowSelection((prev) => ({
      ...prev,
      ...nextEntries,
    }));
  };

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length || deleteSelectedMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      `Удалить выбранные bookmarks (${selectedIds.length})?`,
    );

    if (!confirmed) {
      return;
    }

    deleteSelectedMutation.mutate(selectedIds);
  };

  const showResetGridLayout =
    viewMode === "grid" || viewMode === "creative";

  const activeResetHandler = showResetGridLayout
    ? () => {
        if (viewMode === "creative") {
          setCreativeResetNonce((prev) => prev + 1);
          return;
        }

        setGridResetNonce((prev) => prev + 1);
      }
    : undefined;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Сохранённые bookmarks. Сейчас реализуем Table View, затем добавим Grid.
          </p>
        </div>

        <LibraryToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => {
            void bookmarksQuery.refetch();
          }}
          filteredCount={filteredData.length}
          selectedCount={selectedIds.length}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={deleteSelectedMutation.isPending}
          isRefreshing={bookmarksQuery.isFetching}
          showResetGridLayout={showResetGridLayout}
          onResetGridLayout={activeResetHandler}
        />

        {bookmarksQuery.isLoading ? (
          <div className="rounded-2xl border bg-background p-8 text-sm text-muted-foreground">
            Загружаем bookmarks...
          </div>
        ) : null}

        {bookmarksQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-background p-8 text-sm text-destructive">
            Не удалось загрузить bookmarks.
          </div>
        ) : null}

        {!bookmarksQuery.isLoading && !bookmarksQuery.isError ? (
          <>
            {viewMode === "table" ? (
              <BookmarksTable
                data={filteredData}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onEdit={(bookmark) => setEditingBookmark(bookmark)}
                isBulkDeleting={deleteSelectedMutation.isPending}
              />
            ) : viewMode === "grid" ? (
              <BookmarksGrid
                key="grid"
                mode="grid"
                data={filteredData}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onEdit={(bookmark) => setEditingBookmark(bookmark)}
                isBulkDeleting={deleteSelectedMutation.isPending}
                resetNonce={gridResetNonce}
              />
            ) : viewMode === "creative" ? (
              <BookmarksGrid
                key="creative"
                mode="creative"
                data={filteredData}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onEdit={(bookmark) => setEditingBookmark(bookmark)}
                isBulkDeleting={deleteSelectedMutation.isPending}
                resetNonce={creativeResetNonce}
              />
            ) : viewMode === "fullscreen" ? (
              <BookmarksFullscreen
                 data={filteredData}
              />
            ) : (
              <BookmarksLargeIcons
                data={filteredData}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            )}
          </>
        ) : null}
      </div>

      <EditBookmarkSheet
        open={Boolean(editingBookmark)}
        bookmark={editingBookmark}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBookmark(null);
          }
        }}
        onSave={(bookmarkId, input) => {
          updateBookmarkMutation.mutate({ bookmarkId, input });
        }}
        isSaving={updateBookmarkMutation.isPending}
      />
    </div>
  );
}
