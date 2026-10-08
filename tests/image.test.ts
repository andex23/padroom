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
      normalizePhoto(new Uint8Array(5 * 1024 * 1024 + 1), "image/jpeg"),
    ).rejects.toThrow("up to 5 MB");
  });
});
