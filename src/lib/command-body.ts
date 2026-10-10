import {
  COMMAND_SIZE_ERROR,
  MAX_COMMAND_BYTES,
  PayloadTooLargeError,
} from "./upload-policy";

export async function boundedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_COMMAND_BYTES) {
      await reader.cancel();
      throw new PayloadTooLargeError(COMMAND_SIZE_ERROR);
    }
    chunks.push(value);
  }
  return new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") ?? "" },
    body: Buffer.concat(chunks),
  }).formData();
}
