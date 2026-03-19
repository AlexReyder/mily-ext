import { LayoutGrid, List, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLibraryViewStore } from "../model/library-view.store";

type LibraryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;

  filteredCount: number;
  selectedCount: number;

  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;

  isBulkDeleting?: boolean;
  isRefreshing?: boolean;
};

export function LibraryToolbar({
  search,
  onSearchChange,
  onRefresh,
  filteredCount,
  selectedCount,
  onSelectAllFiltered,
  onClearSelection,
  onBulkDelete,
  isBulkDeleting = false,
  isRefreshing = false,
}: LibraryToolbarProps) {
  const viewMode = useLibraryViewStore((state) => state.viewMode);
  const setViewMode = useLibraryViewStore((state) => state.setViewMode);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию, URL, тегам"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            <List className="mr-2 size-4" />
            Table
          </Button>

          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            disabled
          >
            <LayoutGrid className="mr-2 size-4" />
            Grid
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing || isBulkDeleting}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0
            ? `Выбрано: ${selectedCount}`
            : `Найдено bookmarks: ${filteredCount}`}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSelectAllFiltered}
            disabled={!filteredCount || isBulkDeleting}
          >
            Select all filtered ({filteredCount})
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClearSelection}
            disabled={!selectedCount || isBulkDeleting}
          >
            <X className="mr-2 size-4" />
            Clear
          </Button>

          <Button
            type="button"
            onClick={onBulkDelete}
            disabled={!selectedCount || isBulkDeleting}
          >
            <Trash2 className="mr-2 size-4" />
            {isBulkDeleting ? "Deleting..." : `Delete selected (${selectedCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}