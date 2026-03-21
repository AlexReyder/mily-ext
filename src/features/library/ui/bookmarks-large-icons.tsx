import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import {
  getBookmarkOpenUrl,
  getBookmarkThumbnailUrl,
} from "@/features/bookmark/model/bookmark.types";
import { cn } from "@/lib/utils";

type BookmarksLargeIconsProps = {
  data: BookmarkRecord[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>;
};

function getFallbackLetter(bookmark: BookmarkRecord) {
  const fromTitle = bookmark.title.trim().charAt(0);

  if (fromTitle) {
    return fromTitle.toUpperCase();
  }

  const openUrl = getBookmarkOpenUrl(bookmark);

  if (openUrl) {
    try {
      return new URL(openUrl).hostname.charAt(0).toUpperCase();
    } catch {
      return openUrl.charAt(0).toUpperCase() || "B";
    }
  }

  return "B";
}

export function BookmarksLargeIcons({
  data,
  rowSelection,
  onRowSelectionChange,
}: BookmarksLargeIconsProps) {
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
      {data.map((bookmark) => {
        const selected = Boolean(rowSelection[bookmark.id]);
        const thumbnailUrl = getBookmarkThumbnailUrl(bookmark);

        return (
          <div
            key={bookmark.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-background p-4 shadow-sm transition hover:shadow-md",
              selected && "ring-2 ring-ring/30",
            )}
          >
            <label className="absolute right-3 top-3 z-10 inline-flex items-center rounded-md border bg-background/95 p-2 shadow-sm">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) =>
                  handleToggleSelected(bookmark.id, e.target.checked)
                }
                className="size-4 rounded border-input"
                aria-label={`Select bookmark ${bookmark.title}`}
              />
            </label>

            <div className="flex items-center justify-center rounded-2xl border bg-muted/40 px-6 py-10">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="size-20 rounded-2xl object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-2xl border bg-background text-2xl font-semibold text-foreground/80">
                  {getFallbackLetter(bookmark)}
                </div>
              )}
            </div>

            <div className="mt-4 min-w-0">
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
              ) : (
                <div className="mt-2 text-xs text-muted-foreground">
                  No tags
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
