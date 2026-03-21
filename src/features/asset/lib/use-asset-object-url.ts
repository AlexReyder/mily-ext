import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAsset } from "@/features/asset/lib/asset.repository";

export function useAssetObjectUrl(assetId?: string) {
  const assetQuery = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => getAsset(assetId!),
    enabled: Boolean(assetId),
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = assetQuery.data?.blob;

    if (!blob) {
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(blob);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [assetQuery.data?.blob]);

  return {
    objectUrl,
    isLoading: assetQuery.isLoading,
  };
}
