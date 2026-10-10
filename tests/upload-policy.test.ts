import { describe, expect, it } from "vitest";
import { commandRequest, PayloadTooLargeError } from "../src/lib/upload-policy";
import { boundedForm } from "../src/lib/command-body";

const url = "http://localhost:3000/api/command";
function upload(size: number) {
  const form = new FormData();
  form.set("command", "upload");
  form.set("listing_id", "00000000-0000-4000-8000-000000000001");
  form.set(
    "photo",
    new File([new Uint8Array(size)], "console.png", {
      type: "image/png",
    }),
  );
  return form;
}

describe("browser multipart upload budget", () => {
  it.each([3_999_999, 4_000_000])(
    "keeps a %i-byte photo and its actual multipart body below the provider cap",
    async (size) => {
      const request = await commandRequest(url, upload(size));
      const bytes = await request.clone().arrayBuffer();
      expect(bytes.byteLength).toBeGreaterThan(size);
      expect(bytes.byteLength).toBeLessThanOrEqual(4_250_000);
      expect(bytes.byteLength).toBeLessThan(4_500_000);
      const parsed = await boundedForm(request);
      const file = parsed.get("photo") as File;
      expect(file.name).toBe("console.png");
      expect(file.type).toBe("image/png");
      expect(file.size).toBe(size);
      expect(parsed.get("listing_id")).toBe(
        "00000000-0000-4000-8000-000000000001",
      );
    },
  );
  it("rejects one byte over the photo cap before sending", async () => {
    await expect(commandRequest(url, upload(4_000_001))).rejects.toThrow(
      "Choose a photo up to 4 MB.",
    );
  });
  it("includes UTF-8 text fields in the whole request budget", async () => {
    const form = upload(4_000_000);
    // JS length is only 140,000, but this field needs 280,000 UTF-8 bytes.
    form.set("extra", "😀".repeat(70_000));
    await expect(commandRequest(url, form)).rejects.toThrow(
      PayloadTooLargeError,
    );
  });
  it("includes additional files in the whole request budget", async () => {
    const form = upload(4_000_000);
    form.set("extra", new File([new Uint8Array(250_000)], "second.png"));
    await expect(commandRequest(url, form)).rejects.toThrow(
      PayloadTooLargeError,
    );
  });
});

function multipart(size: number) {
  const prefix = Buffer.from(
    '--padroom-boundary\r\nContent-Disposition: form-data; name="note"\r\n\r\n',
  );
  const suffix = Buffer.from("\r\n--padroom-boundary--\r\n");
  return {
    bytes: Buffer.concat([
      prefix,
      Buffer.alloc(size - prefix.length - suffix.length, "a"),
      suffix,
    ]),
    textLength: size - prefix.length - suffix.length,
  };
}

describe("server streamed command budget", () => {
  it.each([4_249_999, 4_250_000])(
    "accepts a complete %i-byte multipart body at the boundary",
    async (size) => {
      const { bytes, textLength } = multipart(size);
      const request = new Request(url, {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=padroom-boundary",
        },
        body: bytes,
      });
      expect(request.headers.has("content-length")).toBe(false);
      const form = await boundedForm(request);
      expect((form.get("note") as string).length).toBe(textLength);
    },
  );
  it.each([undefined, "1"])(
    "cancels an over-budget stream with content-length %s",
    async (declaredLength) => {
      let cancelled = false;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(4_250_000));
          controller.enqueue(new Uint8Array(1));
        },
        cancel() {
          cancelled = true;
        },
      });
      const headers = new Headers({
        "content-type": "multipart/form-data; boundary=padroom-boundary",
      });
      if (declaredLength) headers.set("content-length", declaredLength);
      const init: RequestInit & { duplex: "half" } = {
        method: "POST",
        headers,
        body,
        duplex: "half",
      };
      await expect(boundedForm(new Request(url, init))).rejects.toThrow(
        PayloadTooLargeError,
      );
      expect(cancelled).toBe(true);
    },
  );
});
