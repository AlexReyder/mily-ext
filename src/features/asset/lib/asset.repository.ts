import { db } from "@/lib/db";
import type {
  AssetRecord,
  CreateAssetInput,
} from "@/features/asset/model/asset.types";

function normalizeOptionalString(value: string | undefined | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export async function saveAsset(
  input: CreateAssetInput,
): Promise<AssetRecord> {
  const now = new Date().toISOString();

  const record: AssetRecord = {
    id: crypto.randomUUID(),
    kind: input.kind,
    blob: input.blob,
    mimeType:
      normalizeOptionalString(input.mimeType) ??
      (input.blob.type || "application/octet-stream"),
    byteSize: input.blob.size,
    width: input.width,
    height: input.height,
    durationSec: input.durationSec,
    filename: normalizeOptionalString(input.filename),
    sourceUrl: normalizeOptionalString(input.sourceUrl),
    createdAt: now,
    updatedAt: now,
  };

  await db.assets.put(record);

  return record;
}

export async function getAsset(id: string) {
  return db.assets.get(id);
}

export async function deleteAssetsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return 0;
  }

  await db.assets.bulkDelete(uniqueIds);

  return uniqueIds.length;
}
