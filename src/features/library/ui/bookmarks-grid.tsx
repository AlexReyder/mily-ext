import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import type { Layout } from "react-grid-layout";
import ReactGridLayout, {
  useContainerWidth,
  useResponsiveLayout,
} from "react-grid-layout";
import { verticalCompactor } from "react-grid-layout/core";

import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import { isWebsiteBookmark } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridLayouts,
  BookmarkGridState,
  BookmarkViewportPreset,
  BookmarkViewportPresets,
  GridBreakpoint,
  LibraryGridLayoutScope,
} from "../model/library-grid.types";
import {
  getLibraryGridState,
  resetLibraryGridLayouts,
  saveLibraryGridState,
} from "../lib/library-grid-layout.repository";
import {
  getBookmarkViewportPreset,
  GRID_COLS,
  normalizeBookmarkLayoutItem,
  resolveBookmarkItemMetrics,
} from "../lib/bookmark-layout-metrics";
import { BookmarkLiveCard } from "./bookmark-live-card";

type BookmarksGridProps = {
  mode: LibraryGridLayoutScope;
  data: BookmarkRecord[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
  resetNonce?: number;
};

const GRID_BREAKPOINTS: Record<GridBreakpoint, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 0,
};

const creativeOverlapCompactor: typeof verticalCompactor = {
  type: null,
  allowOverlap: true,
  compact(layout: Layout, _cols: number) {
    return layout.map((item) => ({ ...item }));
  },
};

const GRID_MODE_CONFIG: Record<
  LibraryGridLayoutScope,
  {
    compactor: typeof verticalCompactor;
    allowManualResize: boolean;
    boundedDrag: boolean;
  }
> = {
  grid: {
    compactor: verticalCompactor,
    allowManualResize: false,
    boundedDrag: false,
  },
  creative: {
    compactor: creativeOverlapCompactor,
    allowManualResize: true,
    boundedDrag: false,
  },
};

export function BookmarksGrid({
  mode,
  data,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  isBulkDeleting = false,
  resetNonce = 0,
}: BookmarksGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const previousResetNonceRef = useRef(resetNonce);
  const hasHydratedRef = useRef(false);
  const queryClient = useQueryClient();

  const [viewportPresets, setViewportPresets] =
    useState<BookmarkViewportPresets>({});

  const modeConfig = GRID_MODE_CONFIG[mode];
  const activeCompactor = modeConfig.compactor;

  const bookmarkIdsKey = useMemo(
    () => data.map((item) => item.id).sort().join("|"),
    [data],
  );

  const bookmarkById = useMemo(
    () => new Map(data.map((bookmark) => [bookmark.id, bookmark])),
    [data],
  );

  const stateQueryKey = useMemo(
    () => ["library-grid-state", mode, bookmarkIdsKey] as const,
    [bookmarkIdsKey, mode],
  );

  const stateQuery = useQuery({
    queryKey: stateQueryKey,
    queryFn: () => getLibraryGridState(mode, data),
  });

  const saveStateMutation = useMutation({
    mutationFn: (state: BookmarkGridState) => saveLibraryGridState(mode, state),
  });

  const resetLayoutMutation = useMutation({
    mutationFn: () => resetLibraryGridLayouts(mode),
  });

  const {
    layout,
    layouts,
    breakpoint,
    cols,
    setLayoutForBreakpoint,
    setLayouts,
  } = useResponsiveLayout<GridBreakpoint>({
    width,
    breakpoints: GRID_BREAKPOINTS,
    cols: GRID_COLS,
    layouts: stateQuery.data?.layouts ?? {},
    compactor: activeCompactor,
  });

  useEffect(() => {
    if (!stateQuery.data) {
      return;
    }

    setLayouts(stateQuery.data.layouts);
    setViewportPresets(stateQuery.data.viewportPresets);
    hasHydratedRef.current = true;
  }, [setLayouts, stateQuery.data]);

  useEffect(() => {
    if (!mounted || !hasHydratedRef.current || !Object.keys(layouts).length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveStateMutation.mutateAsync({
        layouts,
        viewportPresets,
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [layouts, mounted, saveStateMutation, viewportPresets]);

  useEffect(() => {
    if (resetNonce === previousResetNonceRef.current) {
      return;
    }

    previousResetNonceRef.current = resetNonce;

    void (async () => {
      await resetLayoutMutation.mutateAsync();

      const defaults = await getLibraryGridState(mode, data);

      setLayouts(defaults.layouts);
      setViewportPresets(defaults.viewportPresets);
      hasHydratedRef.current = true;

      queryClient.setQueryData<BookmarkGridState>(stateQueryKey, defaults);
    })();
  }, [
    data,
    mode,
    queryClient,
    resetLayoutMutation,
    resetNonce,
    setLayouts,
    stateQueryKey,
  ]);

  const normalizeInteractiveLayout = (
    nextLayout: Layout,
    nextBreakpoint: GridBreakpoint,
    nextViewportPresets: BookmarkViewportPresets,
  ) => {
    const normalizedLayout = nextLayout.map((item) => {
      const bookmark = bookmarkById.get(item.i);

      if (!bookmark) {
        return item;
      }

      const viewportPreset = getBookmarkViewportPreset(
        bookmark,
        nextViewportPresets,
      );

      return normalizeBookmarkLayoutItem(
        bookmark,
        item,
        nextBreakpoint,
        viewportPreset,
      );
    });

    return mode === "grid"
      ? activeCompactor.compact(normalizedLayout, GRID_COLS[nextBreakpoint])
      : normalizedLayout;
  };

  const persistGridState = (
    nextLayouts: BookmarkGridLayouts,
    nextViewportPresets: BookmarkViewportPresets,
  ) => {
    queryClient.setQueryData<BookmarkGridState>(stateQueryKey, {
      layouts: nextLayouts,
      viewportPresets: nextViewportPresets,
    });

    void saveStateMutation.mutateAsync({
      layouts: nextLayouts,
      viewportPresets: nextViewportPresets,
    });
  };

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

  const applyViewportPreset = (
    bookmarkId: string,
    preset: BookmarkViewportPreset,
  ) => {
    const bookmark = bookmarkById.get(bookmarkId);
    const bp = breakpoint as GridBreakpoint;

    if (!bookmark || !isWebsiteBookmark(bookmark)) {
      return;
    }

    const metrics = resolveBookmarkItemMetrics(bookmark, bp, preset);

    const resizedLayout = layout.map((item) => {
      if (item.i !== bookmarkId) {
        return item;
      }

      const nextW = Math.min(metrics.w, GRID_COLS[bp]);
      const maxX = Math.max(0, GRID_COLS[bp] - nextW);

      return {
        ...item,
        w: nextW,
        h: metrics.h,
        x: Math.min(item.x, maxX),
        minW: metrics.minW,
        minH: metrics.minH,
        maxW: metrics.maxW,
        maxH: metrics.maxH,
      };
    });

    const nextLayout =
      mode === "grid"
        ? activeCompactor.compact(resizedLayout, GRID_COLS[bp])
        : resizedLayout;

    const nextViewportPresets: BookmarkViewportPresets = {
      ...viewportPresets,
      [bookmarkId]: preset,
    };

    const normalizedLayout = normalizeInteractiveLayout(
      nextLayout,
      bp,
      nextViewportPresets,
    );

    const nextLayouts: BookmarkGridLayouts = {
      ...layouts,
      [bp]: normalizedLayout,
    };

    setLayoutForBreakpoint(bp, normalizedLayout);
    setViewportPresets(nextViewportPresets);

    persistGridState(nextLayouts, nextViewportPresets);
  };

  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
        Bookmark пока нет
      </div>
    );
  }

  if (!mounted || stateQuery.isLoading || !layout.length) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
          Загружаем grid layout...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        mode === "creative"
          ? "w-full rounded-3xl border border-dashed p-3"
          : "w-full"
      }
    >
      <ReactGridLayout
        key={`${mode}-${breakpoint}`}
        width={width}
        layout={layout}
        onLayoutChange={(nextLayout) => {
          const normalizedLayout = normalizeInteractiveLayout(
            nextLayout,
            breakpoint as GridBreakpoint,
            viewportPresets,
          );

          setLayoutForBreakpoint(
            breakpoint as GridBreakpoint,
            normalizedLayout,
          );
        }}
        gridConfig={{
          cols,
          rowHeight: 56,
          margin: [16, 16],
          containerPadding: mode === "creative" ? [8, 8] : [0, 0],
        }}
        dragConfig={{
          enabled: !isBulkDeleting,
          handle: ".bookmark-grid-drag-handle",
          cancel:
            ".bookmark-grid-no-drag,button,a,input,label,iframe,video,[data-no-drag='true']",
          bounded: modeConfig.boundedDrag,
        }}
        resizeConfig={{
          enabled: !isBulkDeleting && modeConfig.allowManualResize,
          handles: ["se"],
        }}
        compactor={activeCompactor}
      >
        {data.map((bookmark) => (
          <div key={bookmark.id} className="h-full">
            <BookmarkLiveCard
              bookmark={bookmark}
              selected={Boolean(rowSelection[bookmark.id])}
              viewportMode={viewportPresets[bookmark.id] ?? "desktop"}
              onToggleSelected={handleToggleSelected}
              onEdit={onEdit}
              onViewportPresetChange={applyViewportPreset}
              isBulkDeleting={isBulkDeleting}
            />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
