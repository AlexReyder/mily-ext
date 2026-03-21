import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import {
  getBookmarkKindLabel,
  getBookmarkMediaUrl,
  getBookmarkThumbnailUrl,
  isImageBookmark,
} from "@/features/bookmark/model/bookmark.types";
import { cn } from "@/lib/utils";

type BookmarkMediaSurfaceProps = {
  bookmark: BookmarkRecord;
  className?: string;
  title?: string;
  loading?: "lazy" | "eager";
  interactive?: boolean;
  onLoad?: () => void;
};

function MediaUnavailable({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted px-6 text-center">
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function BookmarkMediaSurface({
  bookmark,
  className,
  title,
  loading = "lazy",
  interactive = false,
  onLoad,
}: BookmarkMediaSurfaceProps) {
  const mediaUrl = getBookmarkMediaUrl(bookmark);

  if (!mediaUrl) {
    return (
      <MediaUnavailable
        label={`${getBookmarkKindLabel(bookmark)} preview unavailable`}
      />
    );
  }

  switch (bookmark.kind) {
    case "website":
      return (
        <iframe
          src={mediaUrl}
          title={title ?? bookmark.title}
          loading={loading}
          onLoad={() => onLoad?.()}
          className={cn("border-0 bg-white", className)}
        />
      );

    case "image":
      return (
        <img
          src={mediaUrl}
          alt={
            isImageBookmark(bookmark)
              ? bookmark.content.alt ?? bookmark.title
              : bookmark.title
          }
          loading={loading}
          onLoad={() => onLoad?.()}
          className={cn("object-contain bg-muted", className)}
        />
      );

    case "video":
      return (
        <video
          src={mediaUrl}
          poster={getBookmarkThumbnailUrl(bookmark) ?? undefined}
          preload="metadata"
          playsInline
          muted
          controls={interactive}
          onLoadedData={() => onLoad?.()}
          className={cn("object-contain bg-black", className)}
        />
      );
  }
}
