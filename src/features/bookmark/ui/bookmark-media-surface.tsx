import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import {
  getBookmarkKindLabel,
  getBookmarkMediaUrl,
  getBookmarkThumbnailUrl,
  isImageBookmark,
} from "@/features/bookmark/model/bookmark.types";
import { useAssetObjectUrl } from "@/features/asset/lib/use-asset-object-url";
import { cn } from "@/lib/utils";

type BookmarkMediaSurfaceProps = {
  bookmark: BookmarkRecord;
  className?: string;
  title?: string;
  loading?: "lazy" | "eager";
  interactive?: boolean;
  onLoad?: () => void;
  variant?: "card" | "fullscreen";
};

function MediaUnavailable({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted px-6 text-center">
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function resolveMediaAssetId(
  bookmark: BookmarkRecord,
  variant: "card" | "fullscreen",
) {
  switch (bookmark.kind) {
    case "website":
      return undefined;

    case "image":
      return variant === "fullscreen"
        ? bookmark.content.assetId ??
            bookmark.content.previewAssetId ??
            bookmark.content.thumbnailAssetId
        : bookmark.content.previewAssetId ??
            bookmark.content.thumbnailAssetId ??
            bookmark.content.assetId;

    case "video":
      return bookmark.content.assetId;
  }
}

function resolvePosterAssetId(bookmark: BookmarkRecord) {
  return bookmark.kind === "video" ? bookmark.content.posterAssetId : undefined;
}

export function BookmarkMediaSurface({
  bookmark,
  className,
  title,
  loading = "lazy",
  interactive = false,
  onLoad,
  variant = "card",
}: BookmarkMediaSurfaceProps) {
  const mediaAssetId = resolveMediaAssetId(bookmark, variant);
  const posterAssetId = resolvePosterAssetId(bookmark);
  const { objectUrl: mediaObjectUrl } = useAssetObjectUrl(mediaAssetId);
  const { objectUrl: posterObjectUrl } = useAssetObjectUrl(posterAssetId);

  const fallbackMediaUrl = getBookmarkMediaUrl(bookmark);
  const fallbackPosterUrl = getBookmarkThumbnailUrl(bookmark);
  const mediaUrl = mediaObjectUrl ?? fallbackMediaUrl;
  const posterUrl = posterObjectUrl ?? fallbackPosterUrl;

  if (!mediaUrl && bookmark.kind !== "video") {
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
          src={mediaUrl!}
          title={title ?? bookmark.title}
          loading={loading}
          onLoad={() => onLoad?.()}
          className={cn("border-0 bg-white", className)}
        />
      );

    case "image":
      return (
        <img
          src={mediaUrl!}
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
      if (!mediaUrl) {
        return (
          <MediaUnavailable
            label={`${getBookmarkKindLabel(bookmark)} preview unavailable`}
          />
        );
      }

      return (
        <video
          src={mediaUrl}
          poster={posterUrl ?? undefined}
          preload={interactive ? "metadata" : "none"}
          playsInline
          muted={!interactive}
          controls={interactive}
          onLoadedData={() => onLoad?.()}
          className={cn("object-contain bg-black", className)}
        />
      );
  }
}
