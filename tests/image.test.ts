import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { normalizePhoto } from "../src/lib/image";
describe("real upload content validation", () => {
  it("decodes PNG bytes and stores a bounded JPEG without metadata", async () => {
    const input = await sharp({
      create: { width: 2000, height: 1200, channels: 3, background: "#eee" },
    })
      .png()
      .toBuffer();
    const output = await normalizePhoto(input, "image/png");
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(960);
    expect(meta.exif).toBeUndefined();
  });
  it("rejects HTML pretending to be a JPEG", async () => {
    await expect(
      normalizePhoto(Buffer.from("<script>alert(1)</script>"), "image/jpeg"),
    ).rejects.toThrow();
  });
  it("rejects SVG even when the declared MIME is JPEG", async () => {
    await expect(
      normalizePhoto(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>',
        ),
        "image/jpeg",
      ),
    ).rejects.toThrow("Invalid photo content");
  });
  it("rejects excessive decoded dimensions", async () => {
    const bytes = await sharp({
      create: { width: 6000, height: 6000, channels: 3, background: "#eee" },
    })
      .png()
      .toBuffer();
    await expect(normalizePhoto(bytes, "image/png")).rejects.toThrow();
  });
  it("rejects oversized files before decoding", async () => {
    await expect(
      normalizePhoto(new Uint8Array(4_000_001), "image/jpeg"),
    ).rejects.toThrow("up to 4 MB");
  });
  it.each([3_999_999, 4_000_000])(
    "decodes a valid %i-byte source and preserves the existing JPEG output",
    async (size) => {
      const source = await sharp({
        create: { width: 2000, height: 1200, channels: 3, background: "#eee" },
      })
        .png()
        .toBuffer();
      const padded = Buffer.concat([
        source,
        Buffer.alloc(size - source.length),
      ]);
      const output = await normalizePhoto(padded, "image/png");
      expect(output).toEqual(await normalizePhoto(source, "image/png"));
      const metadata = await sharp(output).metadata();
      expect(metadata.width).toBe(1600);
      expect(metadata.height).toBe(960);
      expect(metadata.format).toBe("jpeg");
    },
  );
});
