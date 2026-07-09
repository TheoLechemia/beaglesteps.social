/** Bluesky rejects `app.bsky.embed.images` blobs above 2 MB; stay safely under that. */
const MAX_BLOB_BYTES = 1_900_000;
const MAX_DIMENSION = 2000;

/** Downscale/re-encode a photo as JPEG until it fits under Bluesky's per-image size limit. */
export async function compressImage(file: File): Promise<Blob> {
  if (file.size <= MAX_BLOB_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.9;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    quality -= 0.15;
  } while (blob && blob.size > MAX_BLOB_BYTES && quality > 0.3);

  return blob ?? file;
}
