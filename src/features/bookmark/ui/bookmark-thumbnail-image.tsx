import type { BookmarkRecord } from "@/features/bookmark/model/bookmark.types";
import { getBookmarkThumbnailUrl } from "@/features/bookmark/model/bookmark.types";
import { useAssetObjectUrl } from "@/features/asset/lib/use-asset-object-url";
import { cn } from "@/lib/utils";

type BookmarkThumbnailImageProps = {
  bookmark: BookmarkRecord;
  alt?: string;
  className?: string;
};

function resolveThumbnailAssetId(bookmark: BookmarkRecord) {
  switch (bookmark.kind) {
    case "website":
      return undefined;

    case "image":
      return (
        bookmark.content.thumbnailAssetId ??
        bookmark.content.previewAssetId ??
        bookmark.content.assetId
      );

    case "video":
      return bookmark.content.posterAssetId;
  }
}

export function BookmarkThumbnailImage({
  bookmark,
  alt = "",
  className,
}: BookmarkThumbnailImageProps) {
  const thumbnailAssetId = resolveThumbnailAssetId(bookmark);
  const { objectUrl } = useAssetObjectUrl(thumbnailAssetId);
  const fallbackUrl = getBookmarkThumbnailUrl(bookmark);
  const src = objectUrl ?? fallbackUrl;

  if (!src) {
    return <div aria-hidden="true" className={cn("bg-border", className)} />;
  }

  return <img src={src} alt={alt} className={cn(className)} loading="lazy" />;
}
