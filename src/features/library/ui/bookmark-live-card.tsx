import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";

type PreviewState = "idle" | "loading" | "ready" | "timeout";
type PreviewViewportMode = "mobile" | "tablet" | "desktop";

type BookmarkLiveCardProps = {
  bookmark: BookmarkRecord;
  selected: boolean;
  onToggleSelected: (bookmarkId: string, checked: boolean) => void;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
};

const PREVIEW_TIMEOUT_MS = 8000;

const VIEWPORTS: Record<
  PreviewViewportMode,
  {
    label: string;
    cardAspectClass: string;
    width: number;
    height: number;
    Icon: typeof Smartphone;
  }
> = {
  mobile: {
    label: "Mobile",
    cardAspectClass: "aspect-[3/4]",
    width: 390,
    height: 844,
    Icon: Smartphone,
  },
  tablet: {
    label: "Tablet",
    cardAspectClass: "aspect-[3/4]",
    width: 768,
    height: 1024,
    Icon: Tablet,
  },
  desktop: {
    label: "Desktop",
    cardAspectClass: "aspect-video",
    width: 1440,
    height: 810,
    Icon: Monitor,
  },
};

export function BookmarkLiveCard({
  bookmark,
  selected,
  onToggleSelected,
  onEdit,
  isBulkDeleting = false,
}: BookmarkLiveCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [shouldMountFrame, setShouldMountFrame] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [viewportMode, setViewportMode] =
    useState<PreviewViewportMode>("desktop");
  const [isInteractive, setIsInteractive] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const viewport = VIEWPORTS[viewportMode];

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
    if (!shouldMountFrame || previewState === "ready") {
      return;
    }

    setPreviewState("loading");

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
  }, [previewState, shouldMountFrame]);

  useEffect(() => {
    const node = previewRef.current;

    if (!node) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;

      setPreviewSize({
        width,
        height,
      });
    });

    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (!previewSize.width || !previewSize.height) {
      return 1;
    }

    return Math.min(
      previewSize.width / viewport.width,
      previewSize.height / viewport.height,
    );
  }, [previewSize.height, previewSize.width, viewport.height, viewport.width]);

  const handleFrameLoad = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setPreviewState("ready");
  };

  const handlePointerEnter = () => {
    setIsInteractive(true);
  };

  const handlePointerLeave = () => {
    setIsInteractive(false);
  };

  const handleFocusCapture = () => {
    setIsInteractive(true);
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (!event.currentTarget.contains(nextTarget as Node | null)) {
      setIsInteractive(false);
    }
  };

  return (
    <div
      ref={rootRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-background shadow-sm transition",
        selected && "ring-2 ring-ring/30",
      )}
    >
      <div
        ref={previewRef}
        className={cn("relative w-full overflow-hidden bg-muted", viewport.cardAspectClass)}
      >
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-3 py-2 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <label className="inline-flex shrink-0 items-center rounded-md border bg-background/90 p-2 shadow-sm">
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

            <div className="inline-flex items-center rounded-lg border bg-background/90 p-1 shadow-sm">
              {(Object.keys(VIEWPORTS) as PreviewViewportMode[]).map((mode) => {
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
                    onClick={() => setViewportMode(mode)}
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

        <div className="absolute inset-0">
          {shouldMountFrame ? (
            <div
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                width: `${viewport.width}px`,
                height: `${viewport.height}px`,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            >
              <iframe
                src={bookmark.url}
                title={bookmark.title}
                loading="lazy"
                onLoad={handleFrameLoad}
                className={cn(
                  "h-full w-full border-0 bg-white transition-opacity duration-300",
                  previewState === "ready" ? "opacity-100" : "opacity-0",
                  isInteractive && previewState === "ready"
                    ? "pointer-events-auto"
                    : "pointer-events-none",
                )}
              />
            </div>
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
      </div>
    </div>
  );
}