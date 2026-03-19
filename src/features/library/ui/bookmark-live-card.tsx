import { useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import type { BookmarkViewportPreset } from "../model/library-grid.types";

type PreviewState = "idle" | "loading" | "ready" | "timeout";

type BookmarkLiveCardProps = {
  bookmark: BookmarkRecord;
  selected: boolean;
  onToggleSelected: (bookmarkId: string, checked: boolean) => void;
  onEdit: (bookmark: BookmarkRecord) => void;
  onViewportPresetChange: (
    bookmarkId: string,
    preset: BookmarkViewportPreset,
  ) => void;
  isBulkDeleting?: boolean;
};

const PREVIEW_TIMEOUT_MS = 8000;

const VIEWPORTS: Record<
  BookmarkViewportPreset,
  {
    label: string;
    Icon: typeof Smartphone;
  }
> = {
  mobile: { label: "Mobile", Icon: Smartphone },
  tablet: { label: "Tablet", Icon: Tablet },
  desktop: { label: "Desktop", Icon: Monitor },
};

export function BookmarkLiveCard({
  bookmark,
  selected,
  onToggleSelected,
  onEdit,
  onViewportPresetChange,
  isBulkDeleting = false,
}: BookmarkLiveCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [shouldMountFrame, setShouldMountFrame] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [viewportMode, setViewportMode] =
    useState<BookmarkViewportPreset>("desktop");
  const [isPointerInside, setIsPointerInside] = useState(false);

  const isInteractive = previewState === "ready" && isPointerInside;

  useEffect(() => {
    const node = rootRef.current;

    if (!node || shouldMountFrame) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setShouldMountFrame(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldMountFrame]);

  useEffect(() => {
    if (!shouldMountFrame) {
      return;
    }

    setPreviewState("loading");

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = window.setTimeout(() => {
      setPreviewState((current) =>
        current === "ready" ? current : "timeout",
      );
    }, PREVIEW_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldMountFrame, viewportMode]);

  const handleFrameLoad = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setPreviewState("ready");
  };

  const handlePointerEnter = () => {
    setIsPointerInside(true);
  };

  const handlePointerLeave = () => {
    setIsPointerInside(false);
  };

  const handleViewportChange = (preset: BookmarkViewportPreset) => {
    setViewportMode(preset);
    onViewportPresetChange(bookmark.id, preset);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm transition",
        selected && "ring-2 ring-ring/30",
      )}
    >
      <div className="bookmark-grid-drag-handle shrink-0 cursor-grab border-b bg-background px-3 py-2 active:cursor-grabbing">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <label className="bookmark-grid-no-drag inline-flex shrink-0 items-center rounded-md border bg-background/90 p-2 shadow-sm">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) =>
                  onToggleSelected(bookmark.id, e.target.checked)
                }
                disabled={isBulkDeleting}
                className="size-4 rounded border-input"
                aria-label={`Select bookmark ${bookmark.title}`}
              />
            </label>

            <div className="bookmark-grid-no-drag inline-flex items-center rounded-lg border bg-background/90 p-1 shadow-sm">
              {(Object.keys(VIEWPORTS) as BookmarkViewportPreset[]).map((mode) => {
                const config = VIEWPORTS[mode];
                const Icon = config.Icon;
                const active = viewportMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    aria-label={`${config.label} view`}
                    aria-pressed={active}
                    title={config.label}
                    onClick={() => handleViewportChange(mode)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {isInteractive ? "Interactive" : "Preview"}
          </div>
        </div>
      </div>

      <div
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative min-h-0 flex-1 overflow-hidden bg-muted"
      >
        {shouldMountFrame ? (
          <iframe
            key={`${bookmark.id}-${viewportMode}`}
            src={bookmark.url}
            title={bookmark.title}
            loading="lazy"
            onLoad={handleFrameLoad}
            className={cn(
              "absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-300",
              previewState === "ready" ? "opacity-100" : "opacity-0",
              isInteractive ? "pointer-events-auto" : "pointer-events-none",
            )}
          />
        ) : null}

        {previewState !== "ready" ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted px-6 text-center">
            <div className="space-y-2">
              <div className="text-sm font-medium">{bookmark.title}</div>
              <div className="text-xs text-muted-foreground">
                {previewState === "timeout"
                  ? "Сайт не дал показать live preview или отвечает слишком долго."
                  : "Подготавливаем live preview."}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{bookmark.title}</div>

            {bookmark.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bookmark.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {bookmark.tags.length > 4 ? (
                  <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                    +{bookmark.tags.length - 4}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <Button
            asChild
            variant="outline"
            size="icon"
            className="bookmark-grid-no-drag shrink-0"
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${bookmark.title}`}
              title="Open site"
            >
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}