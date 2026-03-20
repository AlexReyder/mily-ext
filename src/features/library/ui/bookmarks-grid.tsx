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
import type {
  BookmarkGridItem,
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

const GRID_COLS: Record<GridBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
};

const VIEWPORT_PRESETS: Record<
  BookmarkViewportPreset,
  Record<GridBreakpoint, Pick<BookmarkGridItem, "w" | "h" | "minW" | "minH">>
> = {
  mobile: {
    lg: { w: 4, h: 11, minW: 4, minH: 8 },
    md: { w: 4, h: 10, minW: 4, minH: 8 },
    sm: { w: 3, h: 9, minW: 3, minH: 7 },
    xs: { w: 2, h: 8, minW: 2, minH: 7 },
  },
  tablet: {
    lg: { w: 6, h: 10, minW: 5, minH: 8 },
    md: { w: 6, h: 9, minW: 5, minH: 8 },
    sm: { w: 4, h: 8, minW: 4, minH: 7 },
    xs: { w: 4, h: 7, minW: 4, minH: 6 },
  },
  desktop: {
    lg: { w: 8, h: 10, minW: 6, minH: 8 },
    md: { w: 8, h: 9, minW: 6, minH: 8 },
    sm: { w: 6, h: 8, minW: 6, minH: 7 },
    xs: { w: 4, h: 7, minW: 4, minH: 6 },
  },
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
    const bp = breakpoint as GridBreakpoint;
    const config = VIEWPORT_PRESETS[preset][bp];

    const resizedLayout = layout.map((item) => {
      if (item.i !== bookmarkId) {
        return item;
      }

      const nextW = Math.min(config.w, GRID_COLS[bp]);
      const maxX = Math.max(0, GRID_COLS[bp] - nextW);

      return {
        ...item,
        w: nextW,
        h: config.h,
        x: Math.min(item.x, maxX),
        minW: config.minW,
        minH: config.minH,
      };
    });

    const nextLayout =
      mode === "grid"
        ? activeCompactor.compact(resizedLayout, GRID_COLS[bp])
        : resizedLayout;

    const nextLayouts: BookmarkGridLayouts = {
      ...layouts,
      [bp]: nextLayout,
    };

    const nextViewportPresets: BookmarkViewportPresets = {
      ...viewportPresets,
      [bookmarkId]: preset,
    };

    setLayoutForBreakpoint(bp, nextLayout);
    setViewportPresets(nextViewportPresets);

    queryClient.setQueryData<BookmarkGridState>(stateQueryKey, {
      layouts: nextLayouts,
      viewportPresets: nextViewportPresets,
    });

    void saveStateMutation.mutateAsync({
      layouts: nextLayouts,
      viewportPresets: nextViewportPresets,
    });
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
          setLayoutForBreakpoint(breakpoint as GridBreakpoint, nextLayout);
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
            ".bookmark-grid-no-drag,button,a,input,label,iframe,[data-no-drag='true']",
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