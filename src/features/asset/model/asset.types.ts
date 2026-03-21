export type AssetKind = "image" | "video" | "thumbnail";

export type AssetRecord = {
  id: string;
  kind: AssetKind;
  blob: Blob;
  mimeType: string;
  byteSize: number;
  width?: number;
  height?: number;
  durationSec?: number;
  filename?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssetInput = Omit<
  AssetRecord,
  "id" | "byteSize" | "createdAt" | "updatedAt"
>;
