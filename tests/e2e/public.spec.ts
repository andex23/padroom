import { test, expect } from "@playwright/test";
test("approved homepage, responsive navigation and brand font", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Fresh in the room", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
  await page.getByRole("searchbox").fill("No inventory matches this 917324");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=No/);
  await expect(
    page.getByRole("heading", {
      name: /No matching listings|Connect the marketplace database/,
    }),
  ).toBeVisible();
  const brand = await page.evaluate(async () => {
    await document.fonts.load('12px "Paper Mono"');
    return {
      loaded: document.fonts.check('12px "Paper Mono"'),
      overflow: document.documentElement.scrollWidth > innerWidth,
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(brand.loaded).toBe(true);
  expect(brand.overflow).toBe(false);
  expect(brand.bg).toBe("rgb(243, 242, 238)");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `/tmp/padroom-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("private routes require real authentication", async ({ page }) => {
  for (const path of ["/saved", "/messages", "/sell/new", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/sign-in/);
  }
});
test("pilot copy and no simulated checkout", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(
    page.getByText(
      "PADROOM does not currently hold funds or guarantee transactions.",
      { exact: false },
    ),
  ).toBeVisible();
});
test("cross-origin mutations are rejected", async ({ request }) => {
  const response = await request.post("/api/command", {
    headers: { origin: "https://evil.example" },
    form: { command: "sign-out" },
  });
  expect(response.status()).toBe(403);
});

test("drawer filters, search and sorting preserve the selected inventory query", async ({
  page,
}) => {
  await page.goto("/?category=Consoles");
  await page.getByRole("button", { name: /^Filter/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await page.getByLabel("Location", { exact: true }).selectOption("Lagos");
  await page.getByLabel("Minimum price (₦)", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/city=Lagos/);
  await expect(page).toHaveURL(/category=Consoles/);
  await page.getByRole("searchbox").fill("PlayStation");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=PlayStation/);
  await expect(page).toHaveURL(/city=Lagos/);
  await expect(page).toHaveURL(/min=1000/);
  await page.getByRole("button", { name: /^Filter/ }).click();
  await page
    .getByLabel("Sort by", { exact: true })
    .selectOption("Price: low to high");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe("Price: low to high");
  await expect(page).toHaveURL(/q=PlayStation/);
  await page
    .getByRole("navigation", { name: "Categories" })
    .getByRole("link", { name: "Games", exact: true })
    .click();
  await expect(page).toHaveURL(/category=Games/);
  await expect(page).toHaveURL(/city=Lagos/);
  await page
    .getByRole("link", { name: "Remove Lagos filter", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("city"))
    .toBeNull();
  await expect(page).toHaveURL(/category=Games/);
});

test("the catalogue and account shell fit every required viewport", async ({
  page,
}) => {
  for (const [width, height] of [
    [375, 667],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("approved shell hierarchy, four mobile destinations and accessible filter sheet", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("searchbox");
  await expect(search).toHaveAttribute(
    "placeholder",
    "Search games, consoles, accessories...",
  );
  const categories = page.getByRole("navigation", { name: "Categories" });
  await expect(categories.getByRole("link")).toHaveText([
    "Discover",
    "Consoles",
    "Games",
    "Accessories",
  ]);
  await expect(
    categories.getByRole("link", { name: "Discover" }),
  ).toHaveAttribute("aria-current", "page");
  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Saved listings", exact: true }),
  ).toHaveAttribute("href", "/saved");
  await expect(
    header.getByRole("link", { name: "Account", exact: true }),
  ).toHaveAttribute("href", "/sign-in");
  const hierarchy = await page.evaluate(() => {
    const top = document
      .querySelector("header .wordmark")!
      .getBoundingClientRect();
    const search = document
      .querySelector(".header-search")!
      .getBoundingClientRect();
    const tabs = document.querySelector(".tabs")!.getBoundingClientRect();
    const heading = document
      .querySelector(".feed-header")!
      .getBoundingClientRect();
    return {
      ordered:
        top.bottom <= search.top &&
        search.bottom <= tabs.top &&
        tabs.bottom <= heading.top,
      headingBottom: heading.bottom,
      navFont: getComputedStyle(document.querySelector(".tabs")!).fontFamily,
    };
  });
  expect(hierarchy.ordered).toBe(true);
  expect(hierarchy.headingBottom).toBeLessThan(280);
  expect(hierarchy.navFont).toContain("Paper Mono");
  const mobile = page.getByRole("navigation", { name: "Mobile navigation" });
  if (await mobile.isVisible()) {
    await expect(mobile.getByRole("link")).toHaveText([
      "Home",
      "Explore",
      "Sell",
      "Account",
    ]);
    for (const link of await header.locator(".account-nav a").all()) {
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await mobile.getByRole("link", { name: "Explore", exact: true }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(search).toBeFocused();
    await expect(mobile.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await mobile.getByRole("link", { name: "Home", exact: true }).click();
  }
  const trigger = page.getByRole("button", { name: "Filter", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await expect(
    page
      .getByLabel("Category", { exact: true })
      .getByRole("option", { name: "Controllers", exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.screenshot({
    path: `/tmp/padroom-approved-${test.info().project.name}.png`,
    fullPage: true,
  });
});
