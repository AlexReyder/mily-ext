import type { Dispatch, SetStateAction } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { ExternalLink, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";

type BookmarksFullscreenProps = {
  data: BookmarkRecord[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>;
  onEdit: (bookmark: BookmarkRecord) => void;
  isBulkDeleting?: boolean;
};

export function BookmarksFullscreen({
  data,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  isBulkDeleting = false,
}: BookmarksFullscreenProps) {
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
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
      {data.map((bookmark) => (
        <section
          key={bookmark.id}
          className="relative h-screen w-screen overflow-hidden border-y bg-black"
        >
          <iframe
            src={bookmark.url}
            title={bookmark.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0 bg-white"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/75 via-black/35 to-transparent">
            <div className="pointer-events-auto flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 max-w-[70ch]">
                <div className="truncate text-sm font-medium text-white">
                  {bookmark.title}
                </div>

                <div className="mt-1 truncate text-xs text-white/70">
                  {bookmark.url}
                </div>

                {bookmark.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bookmark.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/85 backdrop-blur"
                      >
                        {tag}
                      </span>
                    ))}
                    {bookmark.tags.length > 4 ? (
                      <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/85 backdrop-blur">
                        +{bookmark.tags.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex shrink-0 items-center rounded-md border border-white/20 bg-black/30 p-2 text-white shadow-sm backdrop-blur">
                  <input
                    type="checkbox"
                    checked={Boolean(rowSelection[bookmark.id])}
                    onChange={(e) =>
                      handleToggleSelected(bookmark.id, e.target.checked)
                    }
                    disabled={isBulkDeleting}
                    className="size-4 rounded border-input"
                    aria-label={`Select bookmark ${bookmark.title}`}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-white/20 bg-black/30 text-white hover:bg-black/50"
                  onClick={() => onEdit(bookmark)}
                  disabled={isBulkDeleting}
                >
                  <Pencil className="size-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="border-white/20 bg-black/30 text-white hover:bg-black/50"
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
        </section>
      ))}
    </div>
  );
}