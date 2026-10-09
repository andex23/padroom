import { describe, it, expect } from "vitest";
import { toKobo, money, listingInput, safeNext } from "../src/lib/domain";
describe("NGN amounts", () => {
  it("converts decimal strings to exact integer kobo", () => {
    expect(toKobo("245000")).toBe(24500000);
    expect(toKobo("500.01")).toBe(50001);
    expect(toKobo("1.1")).toBe(110);
    expect(toKobo("50000000")).toBe(5000000000);
  });
  it.each(["0", "-1", "1.001", "NaN", "1e6", "50000001", "1,000", "Infinity"])(
    "rejects invalid or out of bounds amount %s",
    (value) => expect(() => toKobo(value)).toThrow(),
  );
  it("formats real NGN prices", () => {
    expect(money(24500000)).toContain("245,000");
    expect(money(50001)).toContain("500.01");
  });
});
describe("listing validation", () => {
  const item = {
    title: "Console with controller",
    brand: "Sony",
    model: "PS5",
    category: "Consoles",
    condition: "Used",
    city: "Lagos",
    price: "245000",
    description: "Tested equipment with original controller included.",
    defects: "None",
    included_items: "Controller and power cable",
  };
  it("validates a real seller payload", () =>
    expect(listingInput.parse(item).price).toBe(24500000));
  it.each([
    { category: "Accounts" },
    { condition: "Verified" },
    { city: "Unknown" },
    { description: "short" },
    { defects: "" },
    { price: "0" },
  ])("rejects incomplete or prohibited listing data", (patch) =>
    expect(() => listingInput.parse({ ...item, ...patch })).toThrow(),
  );
});
describe("redirect safety", () => {
  it.each(["/\t/evil.example", "/\n/evil.example", "/\r/evil.example"])(
    "rejects callbacks that URL parsing normalizes to an external origin %j",
    (value) => {
      const destination = new URL(safeNext(value), "https://padroom.example");
      expect(destination.origin).toBe("https://padroom.example");
      expect(destination.pathname).toBe("/");
    },
  );
  it.each(["https://evil.example", "//evil.example", "/\\evil.example"])(
    "rejects external callback %s",
    (value) => expect(safeNext(value)).toBe("/"),
  );
  it("keeps internal navigation", () =>
    expect(safeNext("/saved")).toBe("/saved"));
  it("keeps internal recovery and listing query destinations", () => {
    expect(safeNext("/reset-password")).toBe("/reset-password");
    expect(safeNext("/listings/item?city=Benin%20City#photos")).toBe(
      "/listings/item?city=Benin%20City#photos",
    );
  });
});
