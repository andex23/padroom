import sharp from "sharp";
export async function normalizePhoto(bytes: Uint8Array, mime: string) {
  if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024)
    throw new Error("Choose a photo up to 5 MB.");
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
