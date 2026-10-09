// Decimal bytes: leave multipart and provider headroom below Vercel's 4.5 MB cap.
export const MAX_PHOTO_BYTES = 4_000_000;
export const MAX_COMMAND_BYTES = 4_250_000;
export const PHOTO_SIZE_ERROR = "Choose a photo up to 4 MB.";
export const COMMAND_SIZE_ERROR =
  "Request too large. Upload one photo at a time (maximum 4 MB).";

export class PayloadTooLargeError extends Error {}

export async function commandRequest(url: string, form: FormData) {
  if (form.get("command") === "upload") {
    const photo = form.get("photo");
    if (!(photo instanceof File) || !photo.size || photo.size > MAX_PHOTO_BYTES)
      throw new PayloadTooLargeError(PHOTO_SIZE_ERROR);
  }
  // Encode once and measure the actual bytes, including fields and filenames.
  const encoded = new Response(form);
  const body = await encoded.blob();
  if (body.size > MAX_COMMAND_BYTES)
    throw new PayloadTooLargeError(COMMAND_SIZE_ERROR);
  return new Request(url, {
    method: "POST",
    headers: encoded.headers,
    body,
  });
}
