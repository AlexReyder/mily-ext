import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";

type PreviewState = "idle" | "loading" | "ready" | "timeout";

type BookmarkLiveCardProps = {
  bookmark: BookmarkRecord;
  selected: boolean;
  onToggleSelected: (bookmarkId: string, checked: boolean) => void;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
};

const PREVIEW_TIMEOUT_MS = 8000;

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BookmarkLiveCard({
  bookmark,
  selected,
  onToggleSelected,
  onEdit,
  isBulkDeleting = false,
}: BookmarkLiveCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [shouldMountFrame, setShouldMountFrame] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");

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

  const handleFrameLoad = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setPreviewState("ready");
  };

  const previewLabel =
    previewState === "idle"
      ? "Live on scroll"
      : previewState === "loading"
        ? "Loading live"
        : previewState === "ready"
          ? "Live"
          : "Live unavailable";

  return (
    <div
      ref={rootRef}
      className={cn(
        "overflow-hidden rounded-2xl border bg-background shadow-sm transition",
        selected && "ring-2 ring-ring/30",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {shouldMountFrame ? (
          <iframe
            src={bookmark.url}
            title={bookmark.title}
            loading="lazy"
            onLoad={handleFrameLoad}
            className={cn(
              "absolute inset-0 h-full w-full border-0 bg-white pointer-events-none transition-opacity duration-300",
              previewState === "ready" ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}

        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
          <label className="inline-flex items-center rounded-lg bg-background/90 p-2 shadow-sm backdrop-blur">
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

          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {previewLabel}
          </span>
        </div>

        {previewState !== "ready" ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted px-6 text-center">
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

        <div className="pointer-events-none absolute inset-0 z-10 bg-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <div className="truncate font-medium">{bookmark.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {getDomain(bookmark.url)}
          </div>
        </div>

        {bookmark.tags.length ? (
          <div className="flex flex-wrap gap-1">
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
        ) : (
          <div className="text-xs text-muted-foreground">No tags</div>
        )}

        <div className="text-xs text-muted-foreground">
          Updated {format(new Date(bookmark.updatedAt), "dd.MM.yyyy HH:mm")}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => onEdit(bookmark)}
          >
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>

          <Button asChild variant="outline" className="h-9">
            <a href={bookmark.url} target="_blank" rel="noreferrer">
              Open
              <ExternalLink className="ml-2 size-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}