import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import { getBookmarkOpenUrl } from "@/features/bookmark/model/bookmark.types";
import { BookmarkMediaSurface } from "@/features/bookmark/ui/bookmark-media-surface";

type BookmarksFullscreenProps = {
  data: BookmarkRecord[];
};

export function BookmarksFullscreen({ data }: BookmarksFullscreenProps) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
        Bookmark пока нет
      </div>
    );
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-80px)] -translate-x-1/2 px-0 pb-10">
      <div className="flex flex-col gap-10">
        {data.map((bookmark) => {
          const openUrl = getBookmarkOpenUrl(bookmark);

          return (
            <section
              key={bookmark.id}
              className="relative h-screen overflow-hidden rounded-3xl border bg-background shadow-sm"
            >
              <BookmarkMediaSurface
                bookmark={bookmark}
                title={bookmark.title}
                loading="lazy"
                interactive
                className="absolute inset-0 h-full w-full"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
                <div className="pointer-events-auto border-t bg-background/96 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {bookmark.title}
                      </div>
                    </div>

                    {openUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                      >
                        <a
                          href={openUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${bookmark.title}`}
                          title="Open bookmark"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
