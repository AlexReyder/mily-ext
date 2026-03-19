import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import ReactGridLayout, {
  useContainerWidth,
  useResponsiveLayout,
} from "react-grid-layout";

import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type {
  BookmarkGridItem,
  BookmarkViewportPreset,
  GridBreakpoint,
} from "../model/library-grid.types";
import {
  getLibraryGridLayouts,
  resetLibraryGridLayouts,
  saveLibraryGridLayouts,
} from "../lib/library-grid-layout.repository";
import { BookmarkLiveCard } from "./bookmark-live-card";

type BookmarksGridProps = {
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

export function BookmarksGrid({
  data,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  isBulkDeleting = false,
  resetNonce = 0,
}: BookmarksGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const previousResetNonceRef = useRef(resetNonce);

  const bookmarkIdsKey = useMemo(
    () => data.map((item) => item.id).sort().join("|"),
    [data],
  );

  const layoutQuery = useQuery({
    queryKey: ["library-grid-layouts", bookmarkIdsKey],
    queryFn: () => getLibraryGridLayouts(data),
  });

  const saveLayoutMutation = useMutation({
    mutationFn: saveLibraryGridLayouts,
  });

  const resetLayoutMutation = useMutation({
    mutationFn: resetLibraryGridLayouts,
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
    layouts: layoutQuery.data ?? {},
  });

  useEffect(() => {
    if (layoutQuery.data) {
      setLayouts(layoutQuery.data);
    }
  }, [layoutQuery.data, setLayouts]);

  useEffect(() => {
    if (!mounted || !Object.keys(layouts).length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveLayoutMutation.mutateAsync(layouts);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [layouts, mounted, saveLayoutMutation]);

  useEffect(() => {
    if (resetNonce === previousResetNonceRef.current) {
      return;
    }

    previousResetNonceRef.current = resetNonce;

    void (async () => {
      await resetLayoutMutation.mutateAsync();
      const defaults = await getLibraryGridLayouts(data);
      setLayouts(defaults);
    })();
  }, [data, resetLayoutMutation, resetNonce, setLayouts]);

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

    const nextLayout = layout.map((item) => {
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

    setLayoutForBreakpoint(bp, nextLayout);
  };

  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
        Bookmark пока нет
      </div>
    );
  }

  if (!mounted || layoutQuery.isLoading || !layout.length) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
          Загружаем grid layout...
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <ReactGridLayout
        width={width}
        layout={layout}
        onLayoutChange={(nextLayout) => {
          setLayoutForBreakpoint(
            breakpoint as GridBreakpoint,
            nextLayout,
          );
        }}
        gridConfig={{
          cols,
          rowHeight: 56,
          margin: [16, 16],
          containerPadding: [0, 0],
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
              onViewportPresetChange={applyViewportPreset}
              isBulkDeleting={isBulkDeleting}
            />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}