import sharp from "sharp";
import { MAX_PHOTO_BYTES, PHOTO_SIZE_ERROR } from "./upload-policy";
export async function normalizePhoto(bytes: Uint8Array, mime: string) {
  if (!bytes.byteLength || bytes.byteLength > MAX_PHOTO_BYTES)
    throw new Error(PHOTO_SIZE_ERROR);
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
    throw new Error("Use a JPEG, PNG or WebP photo.");
  const image = sharp(Buffer.from(bytes), {
    limitInputPixels: 25_000_000,
    animated: false,
  });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
    throw new Error("Invalid photo content.");
  return image
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}
